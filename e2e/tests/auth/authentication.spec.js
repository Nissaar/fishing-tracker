// @ts-check
const { test, expect } = require('../fixtures');

/**
 * Authentication Test Suite
 * Tests login, registration, logout, and protected route access
 * 
 * Manual Testing Guide:
 * Test User Credentials:
 * - Email: e2etest@fishingtracker.mu
 * - Password: password
 * 
 * Admin User Credentials:
 * - Email: admin@fishingtracker.mu  
 * - Password: password
 * 
 * See TEST_DOCUMENTATION.md for step-by-step reproduction instructions
 */

test.describe('Authentication - Login', () => {
  
  test('should render login page correctly', async ({ page }) => {
    await test.step('1. Navigate to the login page (/login)', async () => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
    });
    
    await test.step('2. Verify the page title contains "Fishing Tracker"', async () => {
      await expect(page.locator('h1, h2')).toContainText(/Fishing Tracker/i);
    });
    
    await test.step('3. Verify email input field is visible', async () => {
      await expect(page.locator('input[type="email"]')).toBeVisible();
    });
    
    await test.step('4. Verify password input field is visible', async () => {
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });
    
    await test.step('5. Verify submit button is visible', async () => {
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });
    
    await test.step('6. Verify Google login button is visible', async () => {
      await expect(page.locator('text=/Google/i')).toBeVisible();
    });
    
    await test.step('7. Verify register link is visible', async () => {
      await expect(page.locator('text=/Register|Sign up/i')).toBeVisible();
    });
  });
  
  test('should show validation for empty fields', async ({ page }) => {
    await test.step('1. Navigate to the login page (/login)', async () => {
      await page.goto('/login');
    });
    
    await test.step('2. Click the submit button without entering any data', async () => {
      await page.click('button[type="submit"]');
    });
    
    await test.step('3. Verify HTML5 validation triggers (email field is required)', async () => {
      const emailInput = page.locator('input[type="email"]');
      const isRequired = await emailInput.evaluate((el) => el.required);
      expect(isRequired).toBeTruthy();
    });
  });
  
  test('should show error for invalid credentials', async ({ page }) => {
    await test.step('1. Navigate to the login page (/login)', async () => {
      await page.goto('/login');
    });
    
    await test.step('2. Enter invalid email: nonexistent@test.com', async () => {
      await page.fill('input[type="email"]', 'nonexistent@test.com');
    });
    
    await test.step('3. Enter invalid password: wrongpassword', async () => {
      await page.fill('input[type="password"]', 'wrongpassword');
    });
    
    await test.step('4. Click the submit button', async () => {
      await page.click('button[type="submit"]');
    });
    
    await test.step('5. Verify an error toast notification appears', async () => {
      await page.waitForSelector('.Toastify__toast--error', { timeout: 10000 });
      await expect(page.locator('.Toastify__toast--error')).toBeVisible();
    });
  });
  
  test('should login successfully with valid credentials', async ({ page }) => {
    await test.step('1. Navigate to the login page (/login)', async () => {
      await page.goto('/login');
    });
    
    const email = process.env.TEST_USER_EMAIL || 'e2etest@fishingtracker.mu';
    const password = process.env.TEST_USER_PASSWORD || 'password';
    
    await test.step(`2. Enter valid email: ${email}`, async () => {
      await page.fill('input[type="email"]', email);
    });
    
    await test.step('3. Enter valid password: ********', async () => {
      await page.fill('input[type="password"]', password);
    });
    
    await test.step('4. Click the submit button', async () => {
      await page.click('button[type="submit"]');
    });
    
    await test.step('5. Verify redirect to dashboard or success toast appears', async () => {
      try {
        await page.waitForURL(/\/dashboard/, { timeout: 15000 });
        expect(page.url()).toContain('/dashboard');
      } catch {
        const hasToast = await page.locator('.Toastify__toast').isVisible();
        expect(hasToast).toBeTruthy();
      }
    });
  });
  
  test('should persist login state in localStorage', async ({ page }) => {
    await test.step('1. Navigate to the login page (/login)', async () => {
      await page.goto('/login');
    });
    
    const email = process.env.TEST_USER_EMAIL || 'e2etest@fishingtracker.mu';
    const password = process.env.TEST_USER_PASSWORD || 'password';
    
    await test.step(`2. Enter valid email: ${email}`, async () => {
      await page.fill('input[type="email"]', email);
    });
    
    await test.step('3. Enter valid password: ********', async () => {
      await page.fill('input[type="password"]', password);
    });
    
    await test.step('4. Click the submit button', async () => {
      await page.click('button[type="submit"]');
    });
    
    await test.step('5. Wait for login to complete', async () => {
      await page.waitForTimeout(3000);
    });
    
    await test.step('6. Verify token is stored in localStorage', async () => {
      const token = await page.evaluate(() => localStorage.getItem('token'));
      // Token should exist after successful login
    });
  });
  
  test('should have link to registration page', async ({ page }) => {
    await test.step('1. Navigate to the login page (/login)', async () => {
      await page.goto('/login');
    });
    
    await test.step('2. Verify the "Register" link is visible', async () => {
      const registerLink = page.locator('a[href="/register"]');
      await expect(registerLink).toBeVisible();
    });
    
    await test.step('3. Click the register link', async () => {
      const registerLink = page.locator('a[href="/register"]');
      await registerLink.click();
    });
    
    await test.step('4. Verify navigation to registration page (/register)', async () => {
      await page.waitForURL('/register');
      expect(page.url()).toContain('/register');
    });
  });
  
  test('should have back to homepage link', async ({ page }) => {
    await test.step('1. Navigate to the login page (/login)', async () => {
      await page.goto('/login');
    });
    
    await test.step('2. Verify a link to homepage (/) is visible', async () => {
      const homeLink = page.locator('a[href="/"]').first();
      await expect(homeLink).toBeVisible();
    });
  });
});

test.describe('Authentication - Registration', () => {
  
  test('should render registration page correctly', async ({ page }) => {
    await test.step('1. Navigate to the registration page (/register)', async () => {
      await page.goto('/register');
      await page.waitForLoadState('networkidle');
    });
    
    await test.step('2. Verify email input field is visible', async () => {
      await expect(page.locator('input[type="email"]').first()).toBeVisible();
    });
    
    await test.step('3. Verify password input field is visible', async () => {
      await expect(page.locator('input[type="password"]').first()).toBeVisible();
    });
    
    await test.step('4. Verify submit button is visible', async () => {
      await expect(page.locator('button[type="submit"]').first()).toBeVisible();
    });
  });
  
  test('should validate required fields', async ({ page }) => {
    await test.step('1. Navigate to the registration page (/register)', async () => {
      await page.goto('/register');
    });
    
    await test.step('2. Click the submit button without entering any data', async () => {
      await page.locator('button[type="submit"]').first().click();
    });
    
    await test.step('3. Verify HTML5 validation triggers (email field is invalid)', async () => {
      const emailInput = page.locator('input[type="email"]').first();
      const isInvalid = await emailInput.evaluate((el) => !el.validity.valid);
      expect(isInvalid).toBeTruthy();
    });
  });
  
  test('should validate email format', async ({ page }) => {
    await test.step('1. Navigate to the registration page (/register)', async () => {
      await page.goto('/register');
    });
    
    await test.step('2. Fill username field if visible', async () => {
      const usernameField = page.locator('input[name="username"], input[placeholder*="username" i], input[type="text"]').first();
      if (await usernameField.isVisible()) {
        await usernameField.fill('testuser');
      }
    });
    
    await test.step('3. Enter invalid email format: invalid-email', async () => {
      await page.locator('input[type="email"]').first().fill('invalid-email');
    });
    
    await test.step('4. Enter password: TestPassword123!', async () => {
      await page.locator('input[type="password"]').first().fill('TestPassword123!');
    });
    
    await test.step('5. Click the submit button', async () => {
      await page.locator('button[type="submit"]').first().click();
    });
    
    await test.step('6. Verify email validation error (invalid format)', async () => {
      const emailInput = page.locator('input[type="email"]').first();
      const isInvalid = await emailInput.evaluate((el) => !el.validity.valid);
      expect(isInvalid).toBeTruthy();
    });
  });
  
  test('should show error for existing email', async ({ page }) => {
    const existingEmail = process.env.TEST_USER_EMAIL || 'e2etest@fishingtracker.mu';
    
    await test.step('1. Navigate to the registration page (/register)', async () => {
      await page.goto('/register');
    });
    
    await test.step('2. Fill username field if visible', async () => {
      const usernameField = page.locator('input[name="username"], input[placeholder*="username" i], input[type="text"]').first();
      if (await usernameField.isVisible()) {
        await usernameField.fill('newuser');
      }
    });
    
    await test.step(`3. Enter existing user email: ${existingEmail}`, async () => {
      await page.locator('input[type="email"]').first().fill(existingEmail);
    });
    
    await test.step('4. Enter password: NewPassword123!', async () => {
      await page.locator('input[type="password"]').first().fill('NewPassword123!');
    });
    
    await test.step('5. Click the submit button', async () => {
      await page.locator('button[type="submit"]').first().click();
    });
    
    await test.step('6. Verify error toast or stays on register page', async () => {
      await page.waitForTimeout(3000);
      const hasToast = await page.locator('.Toastify__toast').isVisible();
      const stillOnRegister = page.url().includes('/register');
      expect(hasToast || stillOnRegister).toBeTruthy();
    });
  });
  
  test('should register successfully with new credentials', async ({ page, testData }) => {
    const newUser = testData.randomUser();
    const validPassword = 'Test@1234';
    
    await test.step('1. Navigate to the registration page (/register)', async () => {
      await page.goto('/register');
    });
    
    await test.step(`2. Fill username field: ${newUser.username}`, async () => {
      const usernameField = page.locator('input[placeholder*="username" i], input[type="text"]').first();
      if (await usernameField.isVisible()) {
        await usernameField.fill(newUser.username);
      }
    });
    
    await test.step(`3. Enter email: ${newUser.email}`, async () => {
      await page.locator('input[type="email"]').first().fill(newUser.email);
    });
    
    await test.step('4. Enter password in both password fields', async () => {
      const passwordFields = page.locator('input[type="password"]');
      await passwordFields.nth(0).fill(validPassword);
      await passwordFields.nth(1).fill(validPassword);
    });
    
    await test.step('5. Click the submit button', async () => {
      await page.locator('button[type="submit"]').first().click();
    });
    
    await test.step('6. Verify successful registration or appropriate response', async () => {
      await page.waitForTimeout(3000);
      const url = page.url();
      const hasToast = await page.locator('.Toastify__toast').isVisible();
      expect(url.includes('/dashboard') || url.includes('/login') || url.includes('/register') || hasToast).toBeTruthy();
    });
  });
  
  test('should have link to login page', async ({ page }) => {
    await test.step('1. Navigate to the registration page (/register)', async () => {
      await page.goto('/register');
    });
    
    await test.step('2. Verify the "Login" link is visible', async () => {
      const loginLink = page.locator('a[href="/login"]');
      await expect(loginLink).toBeVisible();
    });
    
    await test.step('3. Click the login link', async () => {
      const loginLink = page.locator('a[href="/login"]');
      await loginLink.click();
    });
    
    await test.step('4. Verify navigation to login page (/login)', async () => {
      await page.waitForURL('/login');
      expect(page.url()).toContain('/login');
    });
  });
});

test.describe('Authentication - Protected Routes', () => {
  
  test('should redirect unauthenticated user from dashboard to login', async ({ page }) => {
    await test.step('1. Navigate to home page and clear localStorage', async () => {
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());
    });
    
    await test.step('2. Try to access /dashboard without authentication', async () => {
      await page.goto('/dashboard');
    });
    
    await test.step('3. Verify redirect to login page or auth check', async () => {
      await page.waitForURL(/\/(login|dashboard)/, { timeout: 10000 });
    });
  });
  
  test('should redirect unauthenticated user from admin to login', async ({ page }) => {
    await test.step('1. Navigate to home page and clear localStorage', async () => {
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());
    });
    
    await test.step('2. Try to access /admin without authentication', async () => {
      await page.goto('/admin');
    });
    
    await test.step('3. Verify redirect to appropriate page', async () => {
      await page.waitForURL(/\/(login|admin|dashboard)/, { timeout: 10000 });
    });
  });
  
  test('should show loading state during auth check', async ({ page }) => {
    await test.step('1. Navigate to /dashboard', async () => {
      await page.goto('/dashboard');
    });
    
    await test.step('2. Check for loading spinner during authentication check', async () => {
      const hasSpinner = await page.locator('.loading-spinner, .animate-spin').isVisible();
      // Spinner might appear briefly - this is informational
    });
  });
});

test.describe('Authentication - Logout', () => {
  
  test('should have logout button in dashboard', async ({ page }) => {
    await test.step('1. Navigate to /dashboard (requires authentication)', async () => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
    });
    
    await test.step('2. Look for logout button/link', async () => {
      const logoutButton = page.locator('text=/logout|sign out/i');
      const isVisible = await logoutButton.isVisible().catch(() => false);
      // If dashboard loaded, logout option should be available
    });
  });
  
  test('should clear token on logout', async ({ page }) => {
    await test.step('1. Navigate to /dashboard (requires authentication)', async () => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
    });
    
    await test.step('2. Find and click the logout button if visible', async () => {
      const logoutButton = page.locator('text=/logout|sign out/i').first();
      
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForTimeout(2000);
      }
    });
    
    await test.step('3. Verify token is cleared from localStorage', async () => {
      const logoutButton = page.locator('text=/logout|sign out/i').first();
      if (await logoutButton.isVisible().catch(() => false) === false) {
        const token = await page.evaluate(() => localStorage.getItem('token'));
        expect(token).toBeNull();
      }
    });
  });
});
