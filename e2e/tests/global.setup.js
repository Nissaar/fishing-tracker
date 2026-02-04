// @ts-check
const { test: setup, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Auth file paths
const AUTH_DIR = path.join(__dirname, '../playwright/.auth');
const USER_AUTH_FILE = path.join(AUTH_DIR, 'user.json');
const ADMIN_AUTH_FILE = path.join(AUTH_DIR, 'admin.json');

// Test credentials
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

// Ensure auth directory exists
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

// Get API URL
const getApiUrl = () => {
  if (process.env.TEST_API_URL) return process.env.TEST_API_URL;
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:80';
  return `${baseUrl}/api`;
};

// Wait for API to be healthy
const waitForApi = async (request, maxRetries = 20) => {
  const healthUrl = getApiUrl().replace('/api', '/health');
  console.log(`⏳ Waiting for API at ${healthUrl}...`);
  
  for (let i = 1; i <= maxRetries; i++) {
    try {
      const response = await request.get(healthUrl, { timeout: 5000 });
      if (response.ok()) {
        console.log('✅ API is healthy');
        return;
      }
    } catch (e) {
      console.log(`  Attempt ${i}/${maxRetries}...`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error('API not available');
};

// Login helper - tries UI first, then API
const loginUser = async (page, request, user, authFile, label) => {
  const API_URL = getApiUrl();
  
  console.log(`\n🔐 Authenticating ${label}...`);
  console.log(`   Email: ${user.email}`);
  
  // First, try to register (will fail if exists, that's OK)
  try {
    await request.post(`${API_URL}/auth/register`, {
      data: {
        username: user.username,
        email: user.email,
        password: user.password
      }
    });
  } catch (e) { /* ignore */ }
  
  // Try UI login
  try {
    await page.goto('/login', { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
    
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    
    console.log(`✅ ${label} logged in via UI`);
    await page.context().storageState({ path: authFile });
    return;
  } catch (e) {
    console.log(`⚠️ UI login failed, trying API...`);
  }
  
  // Fallback: API login
  const loginResponse = await request.post(`${API_URL}/auth/login`, {
    data: { email: user.email, password: user.password }
  });
  
  if (!loginResponse.ok()) {
    throw new Error(`${label} login failed: ${loginResponse.status()}`);
  }
  
  const { token } = await loginResponse.json();
  
  // Set token in browser
  await page.goto('/');
  await page.evaluate((t) => localStorage.setItem('token', t), token);
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  console.log(`✅ ${label} logged in via API`);
  await page.context().storageState({ path: authFile });
};

setup.describe('Global Setup', () => {
  
  setup('Authenticate test users', async ({ page, request }) => {
    await waitForApi(request);
    
    // Login regular user
    await loginUser(page, request, TEST_USER, USER_AUTH_FILE, 'Test User');
    
    // Create new context for admin
    const adminContext = await page.context().browser().newContext();
    const adminPage = await adminContext.newPage();
    
    // Login admin user
    await loginUser(adminPage, request, TEST_ADMIN, ADMIN_AUTH_FILE, 'Admin User');
    
    await adminContext.close();
    
    console.log('\n✅ Setup complete - auth files created');
  });
});

module.exports = { TEST_USER, TEST_ADMIN };