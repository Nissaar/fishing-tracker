// @ts-check
/** @typedef {import('@playwright/test').APIResponse} APIResponse */
/** @typedef {import('@playwright/test').Page} Page */
const { test: base, expect } = require('@playwright/test');

/**
 * Extended Playwright test fixtures for Fishing Tracker E2E Testing
 * Provides reusable helpers and page objects
 */

/**
 * @typedef {{
 *   url: string,
 *   getAuthHeaders: (token: string) => Record<string, string>,
 *   login: (email: string, password: string) => Promise<string>,
 *   createFishingLog: (token: string, logData: unknown) => Promise<APIResponse>,
 *   getFishingLogs: (token: string, limit?: number) => Promise<APIResponse>,
 *   deleteFishingLog: (token: string, logId: string) => Promise<APIResponse>,
 *   getLocations: () => Promise<APIResponse>,
 *   getConditions: () => Promise<APIResponse>,
 *   submitContact: (data: unknown) => Promise<APIResponse>,
 *   healthCheck: () => Promise<APIResponse>
 * }} ApiHelper
 */

/**
 * @typedef {{
 *   waitForToast: (message?: string, type?: 'success' | 'error') => Promise<void>,
 *   closeToast: () => Promise<void>,
 *   waitForLoadingComplete: () => Promise<void>,
 *   navigateToDashboardTab: (tabName: string) => Promise<void>,
 *   login: (email: string, password: string) => Promise<void>,
 *   isVisible: (selector: string) => Promise<boolean>,
 *   getSelectOptions: (selector: string) => Promise<string[]>,
 *   selectByText: (selector: string, text: string) => Promise<void>,
 *   fillDate: (selector: string, date: string) => Promise<void>,
 *   fillTime: (selector: string, time: string) => Promise<void>,
 *   takeScreenshot: (name: string) => Promise<void>
 * }} PageHelper
 */

/**
 * @typedef {{
 *   randomUser: () => { username: string, email: string, password: string },
 *   fishingLog: () => Record<string, unknown>,
 *   contactMessage: () => { name: string, email: string, subject: string, message: string },
 *   locations: { id: string, name: string }[],
 *   fishingTypes: string[],
 *   fishingMethods: string[]
 * }} TestData
 */

/** @typedef {{ apiHelper: ApiHelper, pageHelper: PageHelper, testData: TestData }} Fixtures */

// Custom fixtures extending the base test
/** @type {import('@playwright/test').TestType<Fixtures>} */
const test = base.extend({
  // API helper fixture
  apiHelper: async (/** @type {{ request: any }} */ { request }, /** @type {(value: ApiHelper) => Promise<void>} */ use) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    /** @type {ApiHelper} */
    const api = {
      url: API_URL,
      
      // Get auth headers
      getAuthHeaders: (token) => ({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }),
      
      // Login and get token
      async login(email, password) {
        const response = await request.post(`${API_URL}/auth/login`, {
          data: { email, password }
        });
        if (response.ok()) {
          return (await response.json()).token;
        }
        throw new Error('Login failed');
      },
      
      // Create a fishing log
      async createFishingLog(token, logData) {
        const response = await request.post(`${API_URL}/fishing/logs`, {
          headers: this.getAuthHeaders(token),
          data: logData
        });
        return response;
      },
      
      // Get fishing logs
      async getFishingLogs(token, limit = 10) {
        const response = await request.get(`${API_URL}/fishing/logs?limit=${limit}`, {
          headers: this.getAuthHeaders(token)
        });
        return response;
      },
      
      // Delete fishing log
      async deleteFishingLog(token, logId) {
        const response = await request.delete(`${API_URL}/fishing/logs/${logId}`, {
          headers: this.getAuthHeaders(token)
        });
        return response;
      },
      
      // Get locations
      async getLocations() {
        const response = await request.get(`${API_URL}/fishing/locations`);
        return response;
      },
      
      // Get public conditions
      async getConditions() {
        const response = await request.get(`${API_URL}/public/conditions`);
        return response;
      },
      
      // Submit contact message
      async submitContact(data) {
        const response = await request.post(`${API_URL}/contact/submit`, {
          data
        });
        return response;
      },
      
      // Health check
      async healthCheck() {
        const response = await request.get(`${API_URL.replace('/api', '')}/health`);
        return response;
      }
    };
    
    await use(api);
  },
  
  // Page helpers fixture
  pageHelper: async (/** @type {{ page: any }} */ { page }, /** @type {(value: PageHelper) => Promise<void>} */ use) => {
    /** @type {PageHelper} */
    const helper = {
      // Wait for toast message
      async waitForToast(message, type = 'success') {
        const toastSelector = type === 'success' 
          ? '.Toastify__toast--success'
          : '.Toastify__toast--error';
        await page.waitForSelector(toastSelector, { timeout: 10000 });
        if (message) {
          await expect(page.locator(toastSelector)).toContainText(message);
        }
      },
      
      // Close toast
      async closeToast() {
        const closeBtn = page.locator('.Toastify__close-button');
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
        }
      },
      
      // Wait for loading to complete
      async waitForLoadingComplete() {
        // Wait for any loading spinners to disappear
        const spinners = [
          '.loading-spinner',
          '.animate-spin',
          '[data-loading="true"]'
        ];
        for (const spinner of spinners) {
          const element = page.locator(spinner);
          if (await element.count() > 0) {
            await element.waitFor({ state: 'hidden', timeout: 30000 });
          }
        }
      },
      
      // Navigate to dashboard tab
      async navigateToDashboardTab(tabName) {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        const tabButton = page.locator(`button:has-text("${tabName}")`);
        await tabButton.click();
        await helper.waitForLoadingComplete();
      },
      
      // Fill and submit login form
      async login(email, password) {
        await page.goto('/login');
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/dashboard/, { timeout: 30000 });
      },
      
      // Check if element is visible
      async isVisible(selector) {
        const element = page.locator(selector);
        return await element.isVisible();
      },
      
      // Get all options from a select
      async getSelectOptions(selector) {
        const options = await page.locator(`${selector} option`).allTextContents();
        return options;
      },
      
      // Select from dropdown by text
      async selectByText(selector, text) {
        await page.selectOption(selector, { label: text });
      },
      
      // Fill date input
      async fillDate(selector, date) {
        await page.fill(selector, date);
      },
      
      // Fill time input
      async fillTime(selector, time) {
        await page.fill(selector, time);
      },
      
      // Take screenshot with timestamp
      async takeScreenshot(name) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await page.screenshot({ path: `test-results/screenshots/${name}-${timestamp}.png` });
      }
    };
    
    await use(helper);
  },
  
  // Test data generator fixture
  testData: async ({}, /** @type {(value: TestData) => Promise<void>} */ use) => {
    const { faker } = require('@faker-js/faker');
    
    /** @type {TestData} */
    const data = {
      // Generate random user
      randomUser() {
        return {
          username: `E2E_TEST_${faker.internet.userName()}`,
          email: `e2e_${faker.internet.email()}`,
          password: faker.internet.password({ length: 12 })
        };
      },
      
      // Generate fishing log data
      fishingLog() {
        const today = new Date().toISOString().split('T')[0];
        return {
          date: today,
          timeStart: '06:00',
          timeEnd: '12:00',
          location: 'loc_port_louis',
          locationName: 'Port Louis',
          fishingType: 'Casting',
          fishingMethod: 'land',
          caughtFish: 'yes',
          fishCount: faker.number.int({ min: 1, max: 5 }).toString(),
          fishTypes: ['Carangue'],
          notes: `E2E_TEST_${faker.lorem.sentence()}`
        };
      },
      
      // Generate contact message
      contactMessage() {
        return {
          name: `E2E_TEST_${faker.person.fullName()}`,
          email: faker.internet.email(),
          subject: `E2E Test - ${faker.lorem.words(3)}`,
          message: faker.lorem.paragraph()
        };
      },
      
      // Test locations
      locations: [
        { id: 'loc_port_louis', name: 'Port Louis' },
        { id: 'loc_grand_baie', name: 'Grand Baie' },
        { id: 'loc_flic_en_flac', name: 'Flic en Flac' }
      ],
      
      // Fishing types
      fishingTypes: ['Casting', 'Jigging', 'Bottom Fishing', 'Trolling'],
      
      // Fishing methods
      fishingMethods: ['land', 'boat', 'kayak']
    };
    
    await use(data);
  }
});

module.exports = { test, expect };
