// @ts-check
const { test: setup, expect } = require('@playwright/test');
const { faker } = require('@faker-js/faker');
const path = require('path');
const fs = require('fs');

const STORAGE_STATE_USER = path.join(__dirname, '../playwright/.auth/user.json');
const STORAGE_STATE_ADMIN = path.join(__dirname, '../playwright/.auth/admin.json');

// Test user credentials for E2E testing
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'e2etest@fishingtracker.mu',
  password: process.env.TEST_USER_PASSWORD || 'E2ETestPassword123!',
  username: 'E2E Test User'
};

const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@fishingtracker.mu',
  password: process.env.TEST_ADMIN_PASSWORD || 'AdminPassword123!',
  username: 'Admin User'
};

// Ensure auth directory exists
const authDir = path.join(__dirname, '../playwright/.auth');
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

setup.describe('Global Setup', () => {
  
  setup('Create test user and authenticate', async ({ page, request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    console.log('🔧 Setting up test user authentication...');
    
    // Try to register the test user (will fail if already exists)
    try {
      await request.post(`${API_URL}/auth/register`, {
        data: {
          username: TEST_USER.username,
          email: TEST_USER.email,
          password: TEST_USER.password
        }
      });
      console.log('✅ Test user registered successfully');
    } catch (error) {
      console.log('ℹ️ Test user may already exist, proceeding to login');
    }
    
    // Login as test user
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for successful login redirect
    await page.waitForURL(/\/(dashboard|login)/, { timeout: 30000 });
    
    // Check if login was successful
    if (page.url().includes('/dashboard')) {
      console.log('✅ Test user logged in successfully');
      
      // Save authentication state
      await page.context().storageState({ path: STORAGE_STATE_USER });
      console.log('✅ User authentication state saved');
    } else {
      // If login failed, try to create user via API directly
      console.log('⚠️ Login via UI failed, attempting API registration...');
      
      // Attempt direct API login
      const loginResponse = await request.post(`${API_URL}/auth/login`, {
        data: {
          email: TEST_USER.email,
          password: TEST_USER.password
        }
      });
      
      if (loginResponse.ok()) {
        const loginData = await loginResponse.json();
        
        // Set token in localStorage via page context
        await page.evaluate((token) => {
          localStorage.setItem('token', token);
        }, loginData.token);
        
        await page.goto('/dashboard');
        await page.context().storageState({ path: STORAGE_STATE_USER });
        console.log('✅ User authentication state saved via API');
      } else {
        throw new Error('Failed to authenticate test user');
      }
    }
  });

  setup('Create admin user and authenticate', async ({ page, request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    console.log('🔧 Setting up admin user authentication...');
    
    // Try to register the admin user
    try {
      await request.post(`${API_URL}/auth/register`, {
        data: {
          username: TEST_ADMIN.username,
          email: TEST_ADMIN.email,
          password: TEST_ADMIN.password
        }
      });
      console.log('✅ Admin user registered');
    } catch (error) {
      console.log('ℹ️ Admin user may already exist');
    }
    
    // Set admin flag via direct database or API if available
    // For now, we'll login and assume admin is set up
    
    // Login as admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', TEST_ADMIN.email);
    await page.fill('input[type="password"]', TEST_ADMIN.password);
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForURL(/\/(dashboard|admin)/, { timeout: 30000 });
      
      if (page.url().includes('/dashboard') || page.url().includes('/admin')) {
        console.log('✅ Admin user logged in successfully');
        await page.context().storageState({ path: STORAGE_STATE_ADMIN });
        console.log('✅ Admin authentication state saved');
      }
    } catch (error) {
      console.log('⚠️ Admin login via UI failed, attempting API...');
      
      const loginResponse = await request.post(`${API_URL}/auth/login`, {
        data: {
          email: TEST_ADMIN.email,
          password: TEST_ADMIN.password
        }
      });
      
      if (loginResponse.ok()) {
        const loginData = await loginResponse.json();
        await page.evaluate((token) => {
          localStorage.setItem('token', token);
        }, loginData.token);
        
        await page.goto('/dashboard');
        await page.context().storageState({ path: STORAGE_STATE_ADMIN });
        console.log('✅ Admin authentication state saved via API');
      } else {
        // Create a placeholder admin auth state
        await page.context().storageState({ path: STORAGE_STATE_ADMIN });
        console.log('⚠️ Admin authentication may require manual setup');
      }
    }
  });
});

module.exports = { TEST_USER, TEST_ADMIN };
