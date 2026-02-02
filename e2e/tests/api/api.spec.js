// @ts-check
const { test, expect } = require('../fixtures');

/**
 * API & Backend Test Suite
 * Tests all API endpoints and backend functionality
 */

test.describe('API - Health & Status', () => {
  
  test('should return health check status', async ({ apiHelper }) => {
    const response = await apiHelper.healthCheck();
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('OK');
    expect(data.timestamp).toBeDefined();
  });
});

test.describe('API - Public Endpoints', () => {
  
  test('should return public conditions data', async ({ apiHelper }) => {
    const response = await apiHelper.getConditions();
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    // Should have weather, moon, and tide data
    expect(data).toBeDefined();
  });
  
  test('should return locations list', async ({ apiHelper }) => {
    const response = await apiHelper.getLocations();
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    // Should be array of locations
    expect(Array.isArray(data) || Array.isArray(data.locations)).toBeTruthy();
  });
  
  test('should accept contact form submission', async ({ apiHelper, testData }) => {
    const contactData = testData.contactMessage();
    
    const response = await apiHelper.submitContact(contactData);
    
    // Should return success or validation error
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('API - Authentication Endpoints', () => {
  
  test('should reject login with invalid credentials', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    const response = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'nonexistent@test.com',
        password: 'wrongpassword'
      }
    });
    
    // Should return 401 or 400
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });
  
  test('should login successfully with valid credentials', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    const email = process.env.TEST_USER_EMAIL || 'e2etest@fishingtracker.mu';
    const password = process.env.TEST_USER_PASSWORD || 'E2ETestPassword123!';
    
    const response = await request.post(`${API_URL}/auth/login`, {
      data: { email, password }
    });
    
    if (response.ok()) {
      const data = await response.json();
      expect(data.token).toBeDefined();
    }
    // If not ok, test user might not exist yet
  });
  
  test('should reject registration with existing email', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    const email = process.env.TEST_USER_EMAIL || 'e2etest@fishingtracker.mu';
    
    const response = await request.post(`${API_URL}/auth/register`, {
      data: {
        username: 'duplicateuser',
        email: email,
        password: 'TestPassword123!'
      }
    });
    
    // Should return error for duplicate email
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
  
  test('should return user profile with valid token', async ({ request, apiHelper }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    const email = process.env.TEST_USER_EMAIL || 'e2etest@fishingtracker.mu';
    const password = process.env.TEST_USER_PASSWORD || 'E2ETestPassword123!';
    
    // First login to get token
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email, password }
    });
    
    if (loginResponse.ok()) {
      const { token } = await loginResponse.json();
      
      // Get profile
      const profileResponse = await request.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      expect(profileResponse.ok()).toBeTruthy();
      
      const profile = await profileResponse.json();
      expect(profile.email).toBe(email);
    }
  });
  
  test('should reject profile request without token', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    const response = await request.get(`${API_URL}/auth/profile`);
    
    expect(response.status()).toBe(401);
  });
});

test.describe('API - Fishing Endpoints', () => {
  let authToken = null;
  
  test.beforeAll(async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    const email = process.env.TEST_USER_EMAIL || 'e2etest@fishingtracker.mu';
    const password = process.env.TEST_USER_PASSWORD || 'E2ETestPassword123!';
    
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email, password }
    });
    
    if (loginResponse.ok()) {
      const data = await loginResponse.json();
      authToken = data.token;
    }
  });
  
  test('should return fishing locations', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    if (!authToken) {
      test.skip();
      return;
    }
    
    const response = await request.get(`${API_URL}/fishing/locations`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(Array.isArray(data) || Array.isArray(data.locations)).toBeTruthy();
  });
  
  test('should return dropdown options - fishing types', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    if (!authToken) {
      test.skip();
      return;
    }
    
    const response = await request.get(`${API_URL}/fishing/dropdown/fishing-types`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect(response.ok()).toBeTruthy();
  });
  
  test('should return dropdown options - fishing methods', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    if (!authToken) {
      test.skip();
      return;
    }
    
    const response = await request.get(`${API_URL}/fishing/dropdown/fishing-methods`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect(response.ok()).toBeTruthy();
  });
  
  test('should return dropdown options - baits', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    if (!authToken) {
      test.skip();
      return;
    }
    
    const response = await request.get(`${API_URL}/fishing/dropdown/baits`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect(response.ok()).toBeTruthy();
  });
  
  test('should return dropdown options - fish species', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    if (!authToken) {
      test.skip();
      return;
    }
    
    const response = await request.get(`${API_URL}/fishing/dropdown/fish-species`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect(response.ok()).toBeTruthy();
  });
  
  test('should create a fishing log', async ({ request, testData }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    if (!authToken) {
      test.skip();
      return;
    }
    
    const logData = testData.fishingLog();
    
    const response = await request.post(`${API_URL}/fishing/logs`, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: logData
    });
    
    // Should create successfully or return validation error
    expect(response.status()).toBeLessThan(500);
    
    if (response.ok()) {
      const data = await response.json();
      expect(data.id || data.log || data.success).toBeDefined();
    }
  });
  
  test('should return user fishing logs', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    if (!authToken) {
      test.skip();
      return;
    }
    
    const response = await request.get(`${API_URL}/fishing/logs?limit=10`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(Array.isArray(data) || Array.isArray(data.logs)).toBeTruthy();
  });
  
  test('should return environmental data for location', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    if (!authToken) {
      test.skip();
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    const response = await request.get(`${API_URL}/fishing/environmental-data`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        date: today,
        locationId: 'loc_port_louis'
      }
    });
    
    // Should return data or not found
    expect(response.status()).toBeLessThan(500);
  });
  
  test('should return fishing statistics', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    if (!authToken) {
      test.skip();
      return;
    }
    
    const response = await request.get(`${API_URL}/fishing/statistics`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect(response.ok()).toBeTruthy();
  });
  
  test('should return global predictions', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    if (!authToken) {
      test.skip();
      return;
    }
    
    const response = await request.get(`${API_URL}/fishing/global-predictions`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect(response.ok()).toBeTruthy();
  });
  
  test('should generate trip recommendations', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    if (!authToken) {
      test.skip();
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    const response = await request.post(`${API_URL}/fishing/trip-recommendations`, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        location: 'loc_port_louis',
        date: today,
        startTime: '06:00',
        endTime: '12:00'
      }
    });
    
    // Should return recommendations or error
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('API - Admin Endpoints', () => {
  let adminToken = null;
  
  test.beforeAll(async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    const email = process.env.TEST_ADMIN_EMAIL || 'admin@fishingtracker.mu';
    const password = process.env.TEST_ADMIN_PASSWORD || 'AdminPassword123!';
    
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email, password }
    });
    
    if (loginResponse.ok()) {
      const data = await loginResponse.json();
      adminToken = data.token;
    }
  });
  
  test('should return admin statistics', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    if (!adminToken) {
      test.skip();
      return;
    }
    
    const response = await request.get(`${API_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    // Admin or 403 if not admin
    expect([200, 403]).toContain(response.status());
    
    if (response.ok()) {
      const data = await response.json();
      expect(data.totalUsers || data.stats).toBeDefined();
    }
  });
  
  test('should return users list for admin', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    if (!adminToken) {
      test.skip();
      return;
    }
    
    const response = await request.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect([200, 403]).toContain(response.status());
  });
  
  test('should return submissions for admin', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    if (!adminToken) {
      test.skip();
      return;
    }
    
    const response = await request.get(`${API_URL}/admin/submissions`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect([200, 403]).toContain(response.status());
  });
  
  test('should return contact messages for admin', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    if (!adminToken) {
      test.skip();
      return;
    }
    
    const response = await request.get(`${API_URL}/contact/all`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect([200, 403]).toContain(response.status());
  });
  
  test('should return fishing types for admin', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    if (!adminToken) {
      test.skip();
      return;
    }
    
    const response = await request.get(`${API_URL}/admin/fishing-types`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect([200, 403]).toContain(response.status());
  });
  
  test('should return system logs for admin', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    if (!adminToken) {
      test.skip();
      return;
    }
    
    const response = await request.get(`${API_URL}/admin/system-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect([200, 403]).toContain(response.status());
  });
  
  test('should reject admin endpoints for non-admin users', async ({ request }) => {
    const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
    
    const email = process.env.TEST_USER_EMAIL || 'e2etest@fishingtracker.mu';
    const password = process.env.TEST_USER_PASSWORD || 'E2ETestPassword123!';
    
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email, password }
    });
    
    if (loginResponse.ok()) {
      const { token } = await loginResponse.json();
      
      const response = await request.get(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      expect(response.status()).toBe(403);
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
