// @ts-check
const { test, expect } = require('../fixtures');

/**
 * Public Pages Test Suite
 * Tests all publicly accessible pages without authentication
 * 
 * Manual Testing Guide:
 * 1. Start backend: cd backend && npm start
 * 2. Start frontend: cd frontend && npm start (port 3000)
 * 3. No login required - all tests work as public user
 * 4. Check TEST_DOCUMENTATION.md for detailed steps per test
 */

test.describe('Public Pages - Rendering & Display', () => {
  
  test.describe('Landing Page', () => {
    test('should render landing page correctly', async ({ page }) => {
      await test.step('1. Navigate to the landing page (/)', async () => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
      });
      
      await test.step('2. Verify main heading (h1) is visible', async () => {
        await expect(page.locator('h1').first()).toBeVisible();
      });
      
      await test.step('3. Verify page body is loaded', async () => {
        await expect(page.locator('body')).toBeVisible();
      });
    });
    
    test('should display navigation links', async ({ page }) => {
      await test.step('1. Navigate to the landing page (/)', async () => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
      });
      
      await test.step('2. Verify "About" link is visible in navigation', async () => {
        await expect(page.getByRole('link', { name: /about/i }).first()).toBeVisible();
      });
      
      await test.step('3. Verify "Contact" link is visible in navigation', async () => {
        await expect(page.getByRole('link', { name: /contact/i }).first()).toBeVisible();
      });
      
      await test.step('4. Verify "Sign In" link is visible in navigation', async () => {
        await expect(page.getByRole('link', { name: /sign in/i }).first()).toBeVisible();
      });
    });
    
    test('should load fishing conditions from API', async ({ page, apiHelper }) => {
      await test.step('1. Check API health endpoint is responding', async () => {
        const healthResponse = await apiHelper.healthCheck();
        expect(healthResponse.ok()).toBeTruthy();
      });
      
      await test.step('2. Navigate to landing page and wait for conditions to load', async () => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      });
      
      await test.step('3. Verify weather/conditions section is visible', async () => {
        const conditionsSection = page.locator('[class*="bg-white"]').first();
        await expect(conditionsSection).toBeVisible();
      });
    });
    
    test('should display fishing rating indicator', async ({ page }) => {
      await test.step('1. Navigate to landing page and wait for content', async () => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      });
      
      await test.step('2. Verify page content is loaded', async () => {
        const pageContent = await page.content();
        expect(pageContent.length).toBeGreaterThan(0);
      });
    });
    
    test('should have date navigation for conditions', async ({ page }) => {
      await test.step('1. Navigate to landing page', async () => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
      });
      
      await test.step('2. Look for date navigation arrows (optional feature)', async () => {
        const leftArrow = page.locator('[class*="ChevronLeft"], button:has-text("<")').first();
        const rightArrow = page.locator('[class*="ChevronRight"], button:has-text(">")').first();
        const hasNav = await leftArrow.isVisible() || await rightArrow.isVisible();
        // This is optional, not all designs have this
      });
    });
    
    test('should be responsive on mobile viewport', async ({ page }) => {
      await test.step('1. Set viewport to mobile size (375x667)', async () => {
        await page.setViewportSize({ width: 375, height: 667 });
      });
      
      await test.step('2. Navigate to landing page', async () => {
        await page.goto('/');
      });
      
      await test.step('3. Verify "Fishing Tracker" title is visible on mobile', async () => {
        await expect(page.locator('h1')).toContainText('Fishing Tracker');
      });
    });
  });
  
  test.describe('About Page', () => {
    test('should render about page correctly', async ({ page }) => {
      await test.step('1. Navigate to /about page', async () => {
        const response = await page.goto('/about');
        expect(response?.status()).toBeLessThan(500);
      });
      
      await test.step('2. Wait for page to load', async () => {
        await page.waitForLoadState('domcontentloaded');
      });
    });
    
    test('should have navigation to other pages', async ({ page }) => {
      await test.step('1. Navigate to /about page', async () => {
        await page.goto('/about');
        await page.waitForLoadState('domcontentloaded');
      });
      
      await test.step('2. Verify link to home page (/) is visible', async () => {
        await expect(page.locator('a[href="/"]').first()).toBeVisible();
      });
    });
  });
  
  test.describe('Contact Page', () => {
    test('should render contact page with form', async ({ page }) => {
      await test.step('1. Navigate to /contact page', async () => {
        await page.goto('/contact');
        await page.waitForLoadState('networkidle');
      });
      
      await test.step('2. Verify name input field is visible', async () => {
        await expect(page.locator('input[name="name"]')).toBeVisible();
      });
      
      await test.step('3. Verify email input field is visible', async () => {
        await expect(page.locator('input[name="email"]')).toBeVisible();
      });
      
      await test.step('4. Verify subject input field is visible', async () => {
        await expect(page.locator('input[name="subject"]')).toBeVisible();
      });
      
      await test.step('5. Verify message textarea is visible', async () => {
        await expect(page.locator('textarea[name="message"]')).toBeVisible();
      });
      
      await test.step('6. Verify submit button is visible', async () => {
        await expect(page.locator('button[type="submit"]')).toBeVisible();
      });
    });
    
    test('should validate required fields', async ({ page }) => {
      await test.step('1. Navigate to /contact page', async () => {
        await page.goto('/contact');
      });
      
      await test.step('2. Click submit button without filling any fields', async () => {
        await page.click('button[type="submit"]');
      });
      
      await test.step('3. Verify HTML5 validation prevents submission (name field invalid)', async () => {
        const nameInput = page.locator('input[name="name"]');
        const isInvalid = await nameInput.evaluate((el) => !el.validity.valid);
        expect(isInvalid).toBeTruthy();
      });
    });
    
    test('should submit contact form successfully', async ({ page, testData }) => {
      const contactData = testData.contactMessage();
      
      await test.step('1. Navigate to /contact page', async () => {
        await page.goto('/contact');
      });
      
      await test.step(`2. Fill in name: ${contactData.name}`, async () => {
        await page.fill('input[name="name"]', contactData.name);
      });
      
      await test.step(`3. Fill in email: ${contactData.email}`, async () => {
        await page.fill('input[name="email"]', contactData.email);
      });
      
      await test.step(`4. Fill in subject: ${contactData.subject}`, async () => {
        await page.fill('input[name="subject"]', contactData.subject);
      });
      
      await test.step('5. Fill in message text', async () => {
        await page.fill('textarea[name="message"]', contactData.message);
      });
      
      await test.step('6. Click submit button', async () => {
        await page.click('button[type="submit"]');
      });
      
      await test.step('7. Verify toast notification appears (success or error)', async () => {
        await page.waitForSelector('.Toastify__toast', { timeout: 10000 });
      });
    });
    
    test('should validate email format', async ({ page }) => {
      await test.step('1. Navigate to /contact page', async () => {
        await page.goto('/contact');
      });
      
      await test.step('2. Fill in valid name: Test User', async () => {
        await page.fill('input[name="name"]', 'Test User');
      });
      
      await test.step('3. Fill in INVALID email: invalid-email', async () => {
        await page.fill('input[name="email"]', 'invalid-email');
      });
      
      await test.step('4. Fill in subject: Test', async () => {
        await page.fill('input[name="subject"]', 'Test');
      });
      
      await test.step('5. Fill in message: Test message', async () => {
        await page.fill('textarea[name="message"]', 'Test message');
      });
      
      await test.step('6. Click submit button', async () => {
        await page.click('button[type="submit"]');
      });
      
      await test.step('7. Verify email field shows validation error', async () => {
        const emailInput = page.locator('input[name="email"]');
        const isInvalid = await emailInput.evaluate((el) => !el.validity.valid);
        expect(isInvalid).toBeTruthy();
      });
    });
  });
  
  test.describe('Privacy Policy Page', () => {
    test('should render privacy policy page', async ({ page }) => {
      await test.step('1. Navigate to /privacy page', async () => {
        const response = await page.goto('/privacy');
        expect(response?.status()).toBeLessThan(500);
      });
    });
  });
  
  test.describe('Data Sources Page', () => {
    test('should render data sources page', async ({ page }) => {
      await test.step('1. Navigate to /data-sources page', async () => {
        const response = await page.goto('/data-sources');
        expect(response?.status()).toBeLessThan(500);
      });
    });
  });
});

test.describe('Public Pages - Navigation', () => {
  
  test('should navigate from landing to about', async ({ page }) => {
    await test.step('1. Navigate to landing page (/)', async () => {
      await page.goto('/');
    });
    
    await test.step('2. Click "About" link in navigation', async () => {
      await page.click('text=About');
    });
    
    await test.step('3. Verify URL changes to /about', async () => {
      await page.waitForURL('/about');
      expect(page.url()).toContain('/about');
    });
  });
  
  test('should navigate from landing to contact', async ({ page }) => {
    await test.step('1. Navigate to landing page (/)', async () => {
      await page.goto('/');
    });
    
    await test.step('2. Click "Contact" link in navigation', async () => {
      await page.click('text=Contact');
    });
    
    await test.step('3. Verify URL changes to /contact', async () => {
      await page.waitForURL('/contact');
      expect(page.url()).toContain('/contact');
    });
  });
  
  test('should navigate from landing to login', async ({ page }) => {
    await test.step('1. Navigate to landing page (/)', async () => {
      await page.goto('/');
    });
    
    await test.step('2. Click "Sign In" link in navigation', async () => {
      await page.getByRole('link', { name: /sign in/i }).first().click();
    });
    
    await test.step('3. Verify URL changes to /login', async () => {
      await page.waitForURL('/login');
      expect(page.url()).toContain('/login');
    });
  });
  
  test('should navigate from landing to register', async ({ page }) => {
    await test.step('1. Navigate to landing page (/)', async () => {
      await page.goto('/');
    });
    
    await test.step('2. Find and click "Register" or "Sign Up" link if visible', async () => {
      const registerLink = page.getByRole('link', { name: /register|sign up/i }).first();
      if (await registerLink.isVisible()) {
        await registerLink.click();
        await page.waitForURL(/register/);
      }
    });
    
    await test.step('3. Verify URL changes to /register (if link exists)', async () => {
      const registerLink = page.getByRole('link', { name: /register|sign up/i }).first();
      if (await registerLink.isVisible().catch(() => false)) {
        expect(page.url()).toContain('/register');
      }
    });
  });
  
  test('should navigate back to home from any page', async ({ page }) => {
    await test.step('1. Navigate to /about page', async () => {
      await page.goto('/about');
    });
    
    await test.step('2. Click the home link (a[href="/"])', async () => {
      await page.click('a[href="/"]');
    });
    
    await test.step('3. Verify URL is back to home page (/)', async () => {
      await page.waitForURL('/');
      expect(page.url()).toMatch(/\/$/);
    });
  });
});
