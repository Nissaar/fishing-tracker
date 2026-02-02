// @ts-check
const { test: teardown } = require('@playwright/test');
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');

const execPromise = util.promisify(exec);

/**
 * Global Teardown - Cleanup after all tests
 * This runs after all test suites have completed
 */
teardown.describe('Global Teardown', () => {
  
  teardown('Cleanup test data from database', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    console.log('🧹 Starting cleanup of test data...');
    
    // Get admin token for cleanup operations
    try {
      const loginResponse = await request.post(`${API_URL}/auth/login`, {
        data: {
          email: process.env.TEST_ADMIN_EMAIL || 'admin@fishingtracker.mu',
          password: process.env.TEST_ADMIN_PASSWORD || 'AdminPassword123!'
        }
      });
      
      if (loginResponse.ok()) {
        const { token } = await loginResponse.json();
        
        // Delete test fishing logs created during tests
        console.log('🗑️ Cleaning up test fishing logs...');
        try {
          await request.delete(`${API_URL}/admin/cleanup/test-data`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: {
              prefix: 'E2E_TEST_',
              tables: ['fishing_logs', 'custom_submissions', 'contact_messages']
            }
          });
          console.log('✅ Test fishing logs cleaned up');
        } catch (error) {
          console.log('⚠️ Could not cleanup via API (endpoint may not exist)');
        }
      }
    } catch (error) {
      console.log('⚠️ Could not authenticate for cleanup');
    }
    
    console.log('✅ Database cleanup completed');
  });

  teardown('Cleanup local test artifacts', async () => {
    console.log('🧹 Cleaning up local test artifacts...');
    
    const artifactsToClean = [
      'playwright/.auth',
      'test-results/traces',
      'test-results/screenshots',
      'test-results/videos'
    ];
    
    for (const artifact of artifactsToClean) {
      const artifactPath = path.join(__dirname, '..', artifact);
      
      if (fs.existsSync(artifactPath)) {
        try {
          fs.rmSync(artifactPath, { recursive: true, force: true });
          console.log(`✅ Cleaned: ${artifact}`);
        } catch (error) {
          console.log(`⚠️ Could not clean: ${artifact}`);
        }
      }
    }
    
    console.log('✅ Local cleanup completed');
  });

  teardown('Generate test summary', async () => {
    console.log('📊 Generating test summary...');
    
    const resultsPath = path.join(__dirname, '..', 'test-results', 'results.json');
    
    if (fs.existsSync(resultsPath)) {
      try {
        const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
        
        const summary = {
          totalTests: results.stats?.expected || 0,
          passed: results.stats?.ok || 0,
          failed: results.stats?.unexpected || 0,
          skipped: results.stats?.skipped || 0,
          duration: results.stats?.duration || 0,
          timestamp: new Date().toISOString()
        };
        
        console.log('📈 Test Summary:');
        console.log(`   Total: ${summary.totalTests}`);
        console.log(`   Passed: ${summary.passed}`);
        console.log(`   Failed: ${summary.failed}`);
        console.log(`   Skipped: ${summary.skipped}`);
        console.log(`   Duration: ${(summary.duration / 1000).toFixed(2)}s`);
        
        // Save summary
        const summaryPath = path.join(__dirname, '..', 'test-results', 'summary.json');
        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
        console.log('✅ Summary saved to test-results/summary.json');
      } catch (error) {
        console.log('⚠️ Could not generate summary:', error.message);
      }
    }
  });
});
