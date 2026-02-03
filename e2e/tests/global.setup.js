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
  password: process.env.TEST_USER_PASSWORD || 'password',
  username: 'E2E Test User'
};

const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@fishingtracker.mu',
  password: process.env.TEST_ADMIN_PASSWORD || 'password',
  username: 'Admin User'
};

// Ensure auth directory exists - create it now and also in setup
const authDir = path.join(__dirname, '../playwright/.auth');
console.log(`📁 Auth directory path: ${authDir}`);
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
  console.log(`📁 Created auth directory: ${authDir}`);
}

// Helper function to ensure auth directory exists
const ensureAuthDir = () => {
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
    console.log(`📁 Created auth directory in setup: ${authDir}`);
  }
};

// Helper function to save storage state with retry
const saveStorageState = async (page, filePath, label) => {
  ensureAuthDir();
  try {
    await page.context().storageState({ path: filePath });
    console.log(`✅ ${label} authentication state saved to ${filePath}`);
    
    // Verify file was created
    if (fs.existsSync(filePath)) {
      console.log(`✅ Verified ${filePath} exists`);
    } else {
      console.error(`❌ File ${filePath} was not created!`);
    }
  } catch (error) {
    console.error(`❌ Failed to save storage state: ${error.message}`);
    throw error;
  }
};

const getApiUrl = () => {
  if (process.env.TEST_API_URL) {
    return process.env.TEST_API_URL;
  }

  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:80';
  const url = new URL(baseUrl);
  return `${url.origin}/api`;
};

const waitForApiHealth = async (request, apiUrl, retries = 15, delayMs = 2000) => {
  const healthUrl = `${apiUrl.replace(/\/api\/?$/, '')}/health`;

  console.log(`🏥 Waiting for API health at ${healthUrl}...`);
  
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await request.get(healthUrl);
      console.log(`  Attempt ${attempt}/${retries}: Health status = ${response.status()}`);
      
      if (response.ok()) {
        console.log(`✅ API is healthy`);
        return;
      }
    } catch (error) {
      console.log(`  Attempt ${attempt}/${retries}: ${error.message}`);
    }

    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(`API not healthy at ${healthUrl} after ${retries} attempts`);
};

const getResponseDetails = async (response) => {
  try {
    const body = await response.json();
    return { status: response.status(), body };
  } catch (error) {
    try {
      const body = await response.text();
      return { status: response.status(), body };
    } catch (innerError) {
      return { status: response.status(), body: null };
    }
  }
};

setup.describe('Global Setup', () => {
  
  setup('Create test user and authenticate', async ({ page, request }) => {
    const API_URL = getApiUrl();
    await waitForApiHealth(request, API_URL);
    
    console.log('🔧 Setting up test user authentication...');
    console.log(`📧 Using email: ${TEST_USER.email}`);
    console.log(`🔐 Using password: ${TEST_USER.password}`);
    console.log(`🌐 API URL: ${API_URL}`);
    
    // Try to register the test user (will fail if already exists)
    try {
      const registerResponse = await request.post(`${API_URL}/auth/register`, {
        data: {
          username: TEST_USER.username,
          email: TEST_USER.email,
          password: TEST_USER.password
        }
      });
      if (registerResponse.ok()) {
        console.log('✅ Test user registered successfully');
      } else {
        const details = await getResponseDetails(registerResponse);
        console.log(`ℹ️ Registration returned status ${details.status}:`, details.body);
      }
    } catch (error) {
      console.log('ℹ️ Test user may already exist, proceeding to login:', error.message);
    }
    
    // Login as test user
    console.log('🌐 Navigating to login page...');
    try {
      await page.goto('/login', { timeout: 10000 });
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      console.log('✅ Login page loaded');
    } catch (error) {
      console.error('❌ Failed to load login page:', error.message);
      throw new Error(`Frontend not accessible at login page: ${error.message}`);
    }
    
    // Fill login form
    console.log('📝 Filling login form...');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    console.log('🔄 Submitted login form, waiting for redirect...');
    
    // Wait for successful login redirect
    try {
      await page.waitForURL(/\/(dashboard|login)/, { timeout: 30000 });
      console.log(`📍 Current URL after login attempt: ${page.url()}`);
    } catch (error) {
      console.error('❌ Timeout waiting for redirect:', error.message);
      console.log(`📍 Current URL: ${page.url()}`);
      // Check for error messages on page
      const pageContent = await page.content();
      console.log('Page content sample:', pageContent.substring(0, 500));
      throw error;
    }
    
    // Check if login was successful
    if (page.url().includes('/dashboard')) {
      console.log('✅ Test user logged in successfully via UI');
      
      // Save authentication state
      await saveStorageState(page, STORAGE_STATE_USER, 'User');
    } else {
      // If login failed, try to create user via API directly
      console.log('⚠️ Login via UI failed (still on login page), attempting API login...');
      
      // Check for error message on page
      try {
        const errorMsg = await page.locator('[role="alert"], .error, .alert').first().textContent({ timeout: 1000 });
        console.log(`🔴 Error message on page: ${errorMsg}`);
      } catch (e) {
        console.log('ℹ️ No error message found on page');
      }
      
      // Attempt direct API login
      console.log(`📡 Attempting API login at ${API_URL}/auth/login`);
      let loginResponse = await request.post(`${API_URL}/auth/login`, {
        data: {
          email: TEST_USER.email,
          password: TEST_USER.password
        }
      });

      if (!loginResponse.ok()) {
        console.log(`❌ First login attempt failed (status ${loginResponse.status()}), trying registration...`);
        
        // Try re-registering, then login again
        const reRegisterResponse = await request.post(`${API_URL}/auth/register`, {
          data: {
            username: TEST_USER.username,
            email: TEST_USER.email,
            password: TEST_USER.password
          }
        });
        console.log(`Re-registration response: ${reRegisterResponse.status()}`);

        loginResponse = await request.post(`${API_URL}/auth/login`, {
          data: {
            email: TEST_USER.email,
            password: TEST_USER.password
          }
        });
      }

      if (loginResponse.ok()) {
        const loginData = await loginResponse.json();

        // Set token in localStorage via page context
        await page.evaluate((token) => {
          localStorage.setItem('token', token);
        }, loginData.token);

        await page.goto('/dashboard');
        await saveStorageState(page, STORAGE_STATE_USER, 'User (via API)');
      } else {
        const details = await getResponseDetails(loginResponse);
        console.error(`❌ Login failed with status ${details.status}`);
        console.error('Response body:', details.body);
        throw new Error(`Failed to authenticate test user (status ${details.status})`);
      }
    }
    
    // Final verification that storage state file exists
    if (!fs.existsSync(STORAGE_STATE_USER)) {
      console.error(`❌ CRITICAL: Storage state file was not created at ${STORAGE_STATE_USER}`);
      throw new Error('User storage state file does not exist after setup');
    }
    console.log(`✅ Verified user storage state exists at ${STORAGE_STATE_USER}`);
  });

  setup('Create admin user and authenticate', async ({ page, request }) => {
    const API_URL = getApiUrl();
    await waitForApiHealth(request, API_URL);
    
    console.log('🔧 Setting up admin user authentication...');
    console.log(`📧 Using email: ${TEST_ADMIN.email}`);
    console.log(`🔐 Using password: ${TEST_ADMIN.password}`);
    
    // Try to register the admin user
    try {
      const registerResponse = await request.post(`${API_URL}/auth/register`, {
        data: {
          username: TEST_ADMIN.username,
          email: TEST_ADMIN.email,
          password: TEST_ADMIN.password
        }
      });
      if (registerResponse.ok()) {
        console.log('✅ Admin user registered');
      } else {
        const details = await getResponseDetails(registerResponse);
        console.log(`ℹ️ Admin registration returned status ${details.status}:`, details.body);
      }
    } catch (error) {
      console.log('ℹ️ Admin user may already exist:', error.message);
    }
    
    // Set admin flag via direct database or API if available
    // For now, we'll login and assume admin is set up
    
    // Login as admin
    console.log('🌐 Navigating to login page for admin...');
    try {
      await page.goto('/login', { timeout: 10000 });
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      console.log('✅ Login page loaded for admin');
    } catch (error) {
      console.error('❌ Failed to load login page:', error.message);
      throw new Error(`Frontend not accessible at login page: ${error.message}`);
    }
    
    console.log('📝 Filling login form for admin...');
    await page.fill('input[type="email"]', TEST_ADMIN.email);
    await page.fill('input[type="password"]', TEST_ADMIN.password);
    await page.click('button[type="submit"]');
    console.log('🔄 Submitted admin login form...');
    
    try {
      await page.waitForURL(/\/(dashboard|admin)/, { timeout: 30000 });
      console.log(`📍 Admin current URL: ${page.url()}`);
      
      if (page.url().includes('/dashboard') || page.url().includes('/admin')) {
        console.log('✅ Admin user logged in successfully via UI');
        await saveStorageState(page, STORAGE_STATE_ADMIN, 'Admin');
      }
    } catch (error) {
      console.log('⚠️ Admin login via UI failed, attempting API...');
      console.log(`📍 Current URL: ${page.url()}`);
      
      // Check for error message
      try {
        const errorMsg = await page.locator('[role="alert"], .error, .alert').first().textContent({ timeout: 1000 });
        console.log(`🔴 Error message on page: ${errorMsg}`);
      } catch (e) {
        console.log('ℹ️ No error message found on page');
      }
      
      let loginResponse = await request.post(`${API_URL}/auth/login`, {
        data: {
          email: TEST_ADMIN.email,
          password: TEST_ADMIN.password
        }
      });

      if (!loginResponse.ok()) {
        console.log(`❌ First admin login attempt failed (status ${loginResponse.status()}), trying registration...`);
        
        const reRegisterResponse = await request.post(`${API_URL}/auth/register`, {
          data: {
            username: TEST_ADMIN.username,
            email: TEST_ADMIN.email,
            password: TEST_ADMIN.password
          }
        });
        console.log(`Admin re-registration response: ${reRegisterResponse.status()}`);

        loginResponse = await request.post(`${API_URL}/auth/login`, {
          data: {
            email: TEST_ADMIN.email,
            password: TEST_ADMIN.password
          }
        });
      }
      
      if (loginResponse.ok()) {
        const loginData = await loginResponse.json();
        await page.evaluate((token) => {
          localStorage.setItem('token', token);
        }, loginData.token);
        
        await page.goto('/dashboard');
        await saveStorageState(page, STORAGE_STATE_ADMIN, 'Admin (via API)');
      } else {
        const details = await getResponseDetails(loginResponse);
        console.error(`❌ Admin login failed with status ${details.status}`);
        console.error('Response body:', details.body);
        throw new Error(`Failed to authenticate admin user (status ${details.status})`);
      }
    }
    
    // Final verification that storage state file exists
    if (!fs.existsSync(STORAGE_STATE_ADMIN)) {
      console.error(`❌ CRITICAL: Storage state file was not created at ${STORAGE_STATE_ADMIN}`);
      throw new Error('Admin storage state file does not exist after setup');
    }
    console.log(`✅ Verified admin storage state exists at ${STORAGE_STATE_ADMIN}`);
  });
});

module.exports = { TEST_USER, TEST_ADMIN };
