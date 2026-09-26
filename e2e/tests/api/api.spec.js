/// <reference path="../types.d.ts" />
/// <reference path="../fixtures.d.ts" />
// @ts-check
/** @type {import('../fixtures')} */
const fixtures = require('../fixtures');
const { test: testBase, expect } = fixtures;
/** @type {import('@playwright/test').TestType<import('../fixtures').Fixtures>} */
const test = testBase;

/**
 * API & Backend Test Suite
 * Tests all API endpoints and backend functionality
 * 
 * Manual Testing Guide:
 * All API endpoints require Bearer token authentication:
 * 
 * 1. Get Auth Token:
 *    POST /api/auth/login
 *    Body: {"email":"e2etest@fishingtracker.mu","password":"password"}
 * 
 * 2. Use Token in Headers:
 *    Authorization: Bearer {token}
 * 
 * Key Endpoints Tested:
 * - GET /api/fishing/locations - Get all fishing spots
 * - GET /api/fishing/environmental-data - Weather, tide, moon data
 * - POST /api/fishing/logs - Create new fishing log
 * - GET /api/fishing/statistics - User statistics
 * - POST /api/fishing/global-predictions - Community insights
 * 
 * Detailed steps: See TEST_DOCUMENTATION.md
 */

test.describe('API - Health & Status', () => {
  
  test('should return health check status', async ({ apiHelper }) => {
    let response;
    
    await test.step('1. Send GET request to /api/health endpoint', async () => {
      response = await apiHelper.healthCheck();
    });
    
    await test.step('2. Verify response status is 200 OK', async () => {
      expect(response.ok()).toBeTruthy();
    });
    
    await test.step('3. Verify response contains status: "OK" and timestamp', async () => {
      const data = await response.json();
      expect(data.status).toBe('OK');
      expect(data.timestamp).toBeDefined();
    });
  });
});

test.describe('API - Public Endpoints', () => {
  
  test('should return public conditions data', async ({ apiHelper }) => {
    let response;
    
    await test.step('1. Send GET request to conditions endpoint (no auth required)', async () => {
      response = await apiHelper.getConditions();
    });
    
    await test.step('2. Verify response status is 200 OK', async () => {
      expect(response.ok()).toBeTruthy();
    });
    
    await test.step('3. Verify response contains weather/moon/tide data', async () => {
      const data = await response.json();
      expect(data.moon.phase).toBeTruthy();
      expect(data.tide).toBeDefined();
      expect(data.weather).toBeDefined();
    });
  });
  
  // The locations list is not public: without a token it must be refused
  // (the authenticated case is covered under Fishing Endpoints)
  test('should require a session for the locations list', async ({ apiHelper }) => {
    let response;
    
    await test.step('1. Send GET request to locations endpoint without a token', async () => {
      response = await apiHelper.getLocations();
    });
    
    await test.step('2. Verify it is rejected as unauthenticated', async () => {
      expect(response.status()).toBe(401);
    });
  });
  
  test('should accept contact form submission', async ({ apiHelper, testData }) => {
    const contactData = testData.contactMessage();
    let response;
    
    await test.step(`1. Prepare contact data: name="${contactData.name}", email="${contactData.email}"`, async () => {
      // Data prepared
    });
    
    await test.step('2. Send POST request to contact endpoint', async () => {
      response = await apiHelper.submitContact(contactData);
    });
    
    await test.step('3. Verify the message was accepted', async () => {
      expect(response.status()).toBe(201);
      expect((await response.json()).messageId).toBeDefined();
    });
  });
});

test.describe('API - Authentication Endpoints', () => {
  
  test('should reject login with invalid credentials', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    let response;
    
    await test.step('1. Send POST to /api/auth/login with invalid credentials', async () => {
      response = await request.post(`${API_URL}/auth/login`, {
        data: {
          email: 'nonexistent@test.com',
          password: 'wrongpassword'
        }
      });
    });
    
    await test.step('2. Verify response is 401 with no token', async () => {
      expect(response.status()).toBe(401);
      expect((await response.json()).token).toBeUndefined();
    });
  });
  
  test('should login successfully with valid credentials', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    const email = process.env.TEST_USER_EMAIL || 'e2etest@fishingtracker.mu';
    const password = process.env.TEST_USER_PASSWORD || 'password';
    let response;
    
    await test.step(`1. Send POST to /api/auth/login with valid email: ${email}`, async () => {
      response = await request.post(`${API_URL}/auth/login`, {
        data: { email, password }
      });
    });
    
    await test.step('2. Verify response contains JWT token on success', async () => {
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.token).toBeTruthy();
      expect(data.user.email).toBe(email);
    });
  });
  
  test('should reject registration with existing email', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    const email = process.env.TEST_USER_EMAIL || 'e2etest@fishingtracker.mu';
    let response;
    
    await test.step(`1. Send POST to /api/auth/register with existing email: ${email}`, async () => {
      response = await request.post(`${API_URL}/auth/register`, {
        data: {
          username: 'duplicateuser',
          email: email,
          password: 'TestPassword123!'
        }
      });
    });
    
    await test.step('2. Verify response is 400 for duplicate email', async () => {
      expect(response.status()).toBe(400);
      expect((await response.json()).error).toBe('Email already registered');
    });
  });
  
  test('should return user profile with valid token', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    const email = process.env.TEST_USER_EMAIL || 'e2etest@fishingtracker.mu';
    const password = process.env.TEST_USER_PASSWORD || 'password';
    
    let token;
    
    await test.step('1. Login to get authentication token', async () => {
      const loginResponse = await request.post(`${API_URL}/auth/login`, {
        data: { email, password }
      });
      expect(loginResponse.ok()).toBeTruthy();
      token = (await loginResponse.json()).token;
    });
    
    await test.step('2. Send GET to /api/auth/profile with Bearer token', async () => {
      const profileResponse = await request.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect(profileResponse.status()).toBe(200);
      const { user } = await profileResponse.json();
      expect(user.email).toBe(email);
      expect(user.is_admin).toBe(false);
    });
  });
  
  test('should reject profile request without token', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    let response;
    
    await test.step('1. Send GET to /api/auth/profile without Authorization header', async () => {
      response = await request.get(`${API_URL}/auth/profile`);
    });
    
    await test.step('2. Verify response is 401 (unauthorized)', async () => {
      expect(response.status()).toBe(401);
    });
  });
});

test.describe('API - Fishing Endpoints', () => {
  /** @type {string | null} */
  let authToken = null;
  
  test.beforeAll(async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    const email = process.env.TEST_USER_EMAIL || 'e2etest@fishingtracker.mu';
    const password = process.env.TEST_USER_PASSWORD || 'password';
    
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email, password }
    });
    
    // Without a token every test below would be meaningless, so fail here
    expect(loginResponse.ok()).toBeTruthy();
    authToken = (await loginResponse.json()).token;
  });
  
  test('should return fishing locations', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    
    const response = await request.get(`${API_URL}/fishing/locations`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(Array.isArray(data) || Array.isArray(data.locations)).toBeTruthy();
  });
  
  test('should return dropdown options - fishing types', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    
    const response = await request.get(`${API_URL}/fishing/dropdown/fishing-types`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect(response.ok()).toBeTruthy();
  });
  
  test('should return dropdown options - fishing methods', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    
    const response = await request.get(`${API_URL}/fishing/dropdown/fishing-methods`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect(response.ok()).toBeTruthy();
  });
  
  test('should return dropdown options - baits', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    
    const response = await request.get(`${API_URL}/fishing/dropdown/baits`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect(response.ok()).toBeTruthy();
  });
  
  test('should return dropdown options - fish species', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    
    const response = await request.get(`${API_URL}/fishing/dropdown/fish-species`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect(response.ok()).toBeTruthy();
  });
  
  test('should create a fishing log', async ({ request, testData }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    
    // The fixture's location id predates the current ids; use a real one
    const logData = { ...testData.fishingLog(), location: 'grand-baie', fishingTypes: ['Casting'] };
    
    const response = await request.post(`${API_URL}/fishing/logs`, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: logData
    });
    
    expect(response.status()).toBe(201);
    const { log } = await response.json();
    expect(log.id).toBeDefined();
    expect(log.location).toBe('grand-baie');

    await request.delete(`${API_URL}/fishing/logs/${log.id}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  });
  
  test('should return user fishing logs', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    
    const response = await request.get(`${API_URL}/fishing/logs?limit=10`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(Array.isArray(data) || Array.isArray(data.logs)).toBeTruthy();
  });
  
  test('should return environmental data for location', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    
    const today = new Date().toISOString().split('T')[0];
    
    const response = await request.get(`${API_URL}/fishing/environmental-data`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        date: today,
        locationId: 'grand-baie'
      }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.moon.phase).toBeTruthy();
    expect(data.weather).toBeDefined();
  });
  
  test('should return fishing statistics', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    
    const response = await request.get(`${API_URL}/fishing/statistics`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect(response.ok()).toBeTruthy();
  });
  
  test('should return global predictions', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    
    const response = await request.get(`${API_URL}/fishing/global-predictions`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect(response.ok()).toBeTruthy();
  });
  
  test('should generate trip recommendations', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    
    const today = new Date().toISOString().split('T')[0];
    
    const response = await request.post(`${API_URL}/fishing/trip-recommendations`, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        location: 'grand-baie',
        date: today,
        startTime: '06:00',
        endTime: '12:00'
      }
    });
    
    expect(response.status()).toBe(200);
  });
});

test.describe('API - Admin Endpoints', () => {
  /** @type {string | null} */
  let adminToken = null;
  
  test.beforeAll(async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    const email = process.env.TEST_ADMIN_EMAIL || 'admin@fishingtracker.mu';
    const password = process.env.TEST_ADMIN_PASSWORD || 'password';
    
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email, password }
    });
    
    // Without a token every test below would be meaningless, so fail here
    expect(loginResponse.ok()).toBeTruthy();
    adminToken = (await loginResponse.json()).token;
  });
  
  test('should return admin statistics', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    
    const response = await request.get(`${API_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.overview.totalUsers).toBeGreaterThanOrEqual(2);
  });
  
  test('should return users list for admin', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    
    const response = await request.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status()).toBe(200);
    const { users } = await response.json();
    expect(users.map(u => u.email)).toContain(process.env.TEST_ADMIN_EMAIL || 'admin@fishingtracker.mu');
  });
  
  test('should return submissions for admin', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    
    const response = await request.get(`${API_URL}/admin/submissions`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status()).toBe(200);
  });
  
  test('should return contact messages for admin', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    
    const response = await request.get(`${API_URL}/contact/all`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status()).toBe(200);
  });
  
  test('should return fishing types for admin', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    
    const response = await request.get(`${API_URL}/admin/fishing-types`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status()).toBe(200);
  });
  
  test('should return system logs for admin', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    
    const response = await request.get(`${API_URL}/admin/system-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status()).toBe(200);
  });
  
  test('should reject admin endpoints for non-admin users', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    const email = process.env.TEST_USER_EMAIL || 'e2etest@fishingtracker.mu';
    const password = process.env.TEST_USER_PASSWORD || 'password';
    
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email, password }
    });
    
    expect(loginResponse.ok()).toBeTruthy();
    const { token } = await loginResponse.json();
    
    for (const endpoint of ['admin/stats', 'admin/users', 'contact/all']) {
      const response = await request.get(`${API_URL}/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect(response.status(), endpoint).toBe(403);
    }
  });

  test('should reject admin endpoints without a token', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';

    for (const endpoint of ['admin/stats', 'contact/all']) {
      const response = await request.get(`${API_URL}/${endpoint}`);
      expect(response.status(), endpoint).toBe(401);
    }
  });
});

test.describe('API - Error Handling', () => {
  
  test('should return 404 for non-existent endpoints', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    const response = await request.get(`${API_URL}/nonexistent/endpoint`);
    
    expect(response.status()).toBe(404);
  });
  
  test('should return proper error format', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    const response = await request.post(`${API_URL}/auth/login`, {
      data: { email: 'invalid', password: '' }
    });
    
    expect(response.status()).toBeGreaterThanOrEqual(400);
    
    const data = await response.json();
    expect(data.error || data.errors || data.message).toBeDefined();
  });
  
  test('should handle malformed JSON', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    const response = await request.post(`${API_URL}/auth/login`, {
      headers: { 'Content-Type': 'application/json' },
      data: 'not valid json'
    });
    
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
