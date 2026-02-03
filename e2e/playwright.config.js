// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Create auth directory and empty auth files on startup
const authDir = path.join(__dirname, 'playwright/.auth');
const userAuthFile = path.join(authDir, 'user.json');
const adminAuthFile = path.join(authDir, 'admin.json');
const emptyAuth = JSON.stringify({ cookies: [], origins: [] });

if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}
if (!fs.existsSync(userAuthFile)) {
  fs.writeFileSync(userAuthFile, emptyAuth);
}
if (!fs.existsSync(adminAuthFile)) {
  fs.writeFileSync(adminAuthFile, emptyAuth);
}

/**
 * Simplified Playwright Configuration
 * - Single browser (Chrome) for speed and simplicity
 * - All 530+ tests maintained
 * - HTML report generated after each run
 */
module.exports = defineConfig({
  testDir: './tests',
  
  // Test timeout - 60s per test
  timeout: 60 * 1000,
  
  // Assertion timeout
  expect: {
    timeout: 10000
  },
  
  // Sequential execution for stability
  fullyParallel: false,
  
  // Fail on test.only in CI
  forbidOnly: !!process.env.CI,
  
  // Retry failed tests
  retries: process.env.CI ? 1 : 0,
  
  // Single worker for consistent execution
  workers: 1,
  
  // HTML report generation
  reporter: [
    ['list'],
    ['html', { 
      outputFolder: 'playwright-report',
      open: 'never'
    }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['./custom-reporter.js']  // Custom reporter for test documentation
  ],
  
  // Global settings - Chrome only
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:80',
    ...devices['Desktop Chrome'],
    
    // Evidence collection
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Timeouts
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  // Test projects - organized by auth requirements
  projects: [
    // 1. Setup - authenticate users
    {
      name: 'setup',
      testMatch: /global\.setup\.js/,
    },
    // 2. Public pages & API - no auth needed
    {
      name: 'public-tests',
      testMatch: ['**/public/**/*.spec.js', '**/api/**/*.spec.js'],
      dependencies: ['setup'],
    },
    // 3. Auth tests - test login/register flows
    {
      name: 'auth-tests',
      testMatch: '**/auth/**/*.spec.js',
      dependencies: ['setup'],
    },
    // 4. User dashboard tests - require user auth
    {
      name: 'dashboard-tests',
      testMatch: '**/dashboard/**/*.spec.js',
      use: { storageState: userAuthFile },
      dependencies: ['setup'],
    },
    // 5. Admin tests - require admin auth
    {
      name: 'admin-tests',
      testMatch: '**/admin/**/*.spec.js',
      use: { storageState: adminAuthFile },
      dependencies: ['setup'],
    },
  ],

  // Output folder
  outputDir: 'test-results',
});