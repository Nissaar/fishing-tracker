// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright configuration for Fishing Tracker Pro E2E Testing
 * Comprehensive testing across multiple browsers
 */
module.exports = defineConfig({
  testDir: './tests',
  
  // Maximum time a test can run
  timeout: 60 * 1000,
  
  // Assertion timeout
  expect: {
    timeout: 10000
  },
  
  // Run tests in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Limit parallel workers on CI
  workers: process.env.CI ? 2 : undefined,
  
  // Reporter configuration - HTML report for results
  reporter: [
    ['list'],
    ['html', { 
      outputFolder: 'playwright-report',
      open: process.env.CI ? 'never' : 'on-failure'
    }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for the application
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:80',
    
    // API URL for backend
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'on-first-retry',
    
    // Action timeout
    actionTimeout: 15000,
    
    // Navigation timeout
    navigationTimeout: 30000,
  },

  // Configure projects for major browsers
  projects: [
    // Setup project - runs before all tests
    {
      name: 'setup',
      testMatch: /global\.setup\.js/,
    },
    
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Mobile viewport tests
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Admin tests with admin authentication
    {
      name: 'admin-tests',
      testMatch: '**/admin/**/*.spec.js',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
    },

    // Cleanup project - runs after all tests
    {
      name: 'teardown',
      testMatch: /global\.teardown\.js/,
    },
  ],

  // Run web server before starting tests
  webServer: process.env.CI ? undefined : {
    command: 'cd .. && docker-compose up -d',
    url: 'http://localhost:80',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },

  // Output folder for test artifacts
  outputDir: 'test-results',
});
