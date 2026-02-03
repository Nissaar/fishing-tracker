/**
 * Cleanup Script for E2E Tests
 * Removes all test data created during E2E testing
 * 
 * Run with: node scripts/cleanup.js
 */

const fs = require('fs');
const path = require('path');
const { exec, execFile } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);
const execFilePromise = util.promisify(execFile);

console.log('🧹 Starting E2E Test Cleanup...\n');

async function cleanup() {
  const errors = [];
  
  // 1. Clean up local test artifacts
  console.log('📁 Cleaning local test artifacts...');
  
  const artifactsToClean = [
    'playwright/.auth',
    'test-results',
    'playwright-report',
    '.playwright'
  ];
  
  for (const artifact of artifactsToClean) {
    const artifactPath = path.join(__dirname, '..', artifact);
    
    try {
      if (fs.existsSync(artifactPath)) {
        fs.rmSync(artifactPath, { recursive: true, force: true });
        console.log(`   ✅ Removed: ${artifact}`);
      } else {
        console.log(`   ⏭️  Skipped (not found): ${artifact}`);
      }
    } catch (error) {
      console.log(`   ❌ Failed to remove: ${artifact} - ${error.message}`);
      errors.push({ artifact, error: error.message });
    }
  }
  
  // 2. Clean up database test data (if database is accessible)
  console.log('\n🗄️  Cleaning database test data...');
  
  try {
    // Try to connect and clean database
    const dbCleanupSQL = `
      -- Clean up E2E test fishing logs
      DELETE FROM fishing_logs WHERE notes LIKE 'E2E_TEST_%';
      
      -- Clean up E2E test custom submissions
      DELETE FROM custom_submissions WHERE value LIKE 'E2E%' OR value LIKE '%E2E Test%';
      
      -- Clean up E2E test contact messages
      DELETE FROM contact_messages WHERE name LIKE 'E2E_TEST_%';
      
      -- Clean up E2E test users (except main test users)
      DELETE FROM users WHERE username LIKE 'E2E_TEST_%' 
        AND email NOT IN ('e2etest@fishingtracker.mu', 'admin@fishingtracker.mu');
    `;
    
    // Write SQL to temp file
    const sqlPath = path.join(__dirname, 'cleanup.sql');
    fs.writeFileSync(sqlPath, dbCleanupSQL);
    
    // Try different database connection methods
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const dbName = process.env.DB_NAME || 'fishing_tracker';
    const dbUser = process.env.DB_USER || 'postgres';
    const dbPassword = process.env.DB_PASSWORD || '';
    
    if (dbPassword) {
      const env = { ...process.env, PGPASSWORD: dbPassword };
      const args = ['-h', dbHost, '-p', dbPort, '-U', dbUser, '-d', dbName, '-f', sqlPath];
      await execFilePromise('psql', args, { env });
      console.log('   ✅ Database test data cleaned');
    } else {
      console.log('   ⏭️  Skipped database cleanup (no password provided)');
    }
    
    // Clean up temp SQL file
    fs.unlinkSync(sqlPath);
    
  } catch (error) {
    console.log(`   ⚠️  Database cleanup skipped: ${error.message}`);
    console.log('   ℹ️  This is normal if database is not running locally');
  }
  
  // 3. Clean up node_modules cache if requested
  if (process.argv.includes('--full')) {
    console.log('\n📦 Cleaning node_modules (full cleanup)...');
    
    try {
      const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        fs.rmSync(nodeModulesPath, { recursive: true, force: true });
        console.log('   ✅ Removed node_modules');
      }
    } catch (error) {
      console.log(`   ❌ Failed to remove node_modules: ${error.message}`);
    }
  }
  
  // 4. Clean up Playwright cache if requested
  if (process.argv.includes('--browsers')) {
    console.log('\n🌐 Cleaning Playwright browsers cache...');
    
    try {
      await execPromise('npx playwright uninstall --all');
      console.log('   ✅ Playwright browsers uninstalled');
    } catch (error) {
      console.log(`   ⚠️  Could not uninstall browsers: ${error.message}`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Cleanup Summary');
  console.log('='.repeat(50));
  
  if (errors.length === 0) {
    console.log('✅ All cleanup tasks completed successfully!');
  } else {
    console.log(`⚠️  Completed with ${errors.length} error(s):`);
    errors.forEach(({ artifact, error }) => {
      console.log(`   - ${artifact}: ${error}`);
    });
  }
  
  console.log('\n💡 Options:');
  console.log('   --full      Also remove node_modules');
  console.log('   --browsers  Also uninstall Playwright browsers');
  console.log('');
}

cleanup().catch(error => {
  console.error('❌ Cleanup failed:', error);
  process.exit(1);
});
