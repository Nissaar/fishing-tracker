// @ts-check
/**
 * Simplified Global Setup for E2E Tests
 * Instead of browser-based auth, we use API tokens directly
 */
const { test: setup, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Test credentials (same as in init-test-users.sql)
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'e2etest@fishingtracker.mu',
  password: process.env.TEST_USER_PASSWORD || 'password'
};

const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@fishingtracker.mu',
  password: process.env.TEST_ADMIN_PASSWORD || 'password'
};

const getApiUrl = () => {
  if (process.env.TEST_API_URL) {
    return process.env.TEST_API_URL;
  }
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:80';
  const url = new URL(baseUrl);
  return `${url.origin}/api`;
};

const waitForApiHealth = async (request, apiUrl, retries = 30, delayMs = 3000) => {
  const healthUrl = `${apiUrl.replace(/\/api\/?$/, '')}/health`;
  console.log(`🏥 Waiting for API health at ${healthUrl}...`);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await request.get(healthUrl, { timeout: 10000 });
      if (response.ok()) {
        console.log(`✅ API is healthy`);
        return;
      }
    } catch (error) {
      console.log(`  Attempt ${attempt}/${retries}: ${error.message}`);
    }
    if (attempt < retries) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw new Error(`API not healthy at ${healthUrl}`);
};

setup.describe('Global Setup - Generate Auth Tokens', () => {
  
  setup('Generate user token', async ({ request }) => {
    const API_URL = getApiUrl();
    await waitForApiHealth(request, API_URL);
    
    console.log('🔧 Generating test user token...');
    
    try {
      const response = await request.post(`${API_URL}/auth/login`, {
        data: {
          email: TEST_USER.email,
          password: TEST_USER.password
        }
      });
      
      if (response.ok()) {
        const data = await response.json();
        console.log(`✅ User token generated successfully`);
        // Save to env file for use in tests
        process.env.TEST_USER_TOKEN = data.token;
      } else {
        console.error(`❌ Failed to get user token: ${response.status()}`);
        throw new Error(`Login failed with status ${response.status()}`);
      }
    } catch (error) {
      console.error(`❌ Error generating user token: ${error.message}`);
      throw error;
    }
  });

  setup('Generate admin token', async ({ request }) => {
    const API_URL = getApiUrl();
    await waitForApiHealth(request, API_URL);
    
    console.log('🔧 Generating admin user token...');
    
    try {
      const response = await request.post(`${API_URL}/auth/login`, {
        data: {
          email: TEST_ADMIN.email,
          password: TEST_ADMIN.password
        }
      });
      
      if (response.ok()) {
        const data = await response.json();
        console.log(`✅ Admin token generated successfully`);
        process.env.TEST_ADMIN_TOKEN = data.token;
      } else {
        console.error(`❌ Failed to get admin token: ${response.status()}`);
        throw new Error(`Admin login failed with status ${response.status()}`);
      }
    } catch (error) {
      console.error(`❌ Error generating admin token: ${error.message}`);
      throw error;
    }
  });
});
