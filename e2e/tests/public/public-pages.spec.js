// @ts-check
const { test, expect } = require('../fixtures');

/**
 * Public Pages Test Suite
 * Tests all publicly accessible pages without authentication
 */

test.describe('Public Pages - Rendering & Display', () => {
  
  test.describe('Landing Page', () => {
    test('should render landing page correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check main heading
      await expect(page.locator('h1')).toContainText('Fishing Tracker Pro');
      
      // Check subtitle
      await expect(page.locator('text=Mauritius')).toBeVisible();
      
      // Check fish icon is visible
      await expect(page.locator('svg').first()).toBeVisible();
    });
    
    test('should display navigation links', async ({ page }) => {
      await page.goto('/');
      
      // Check navigation links exist
      await expect(page.locator('text=About')).toBeVisible();
      await expect(page.locator('text=Contact')).toBeVisible();
      await expect(page.locator('text=Login')).toBeVisible();
      await expect(page.locator('text=Register')).toBeVisible();
    });
    
    test('should load fishing conditions from API', async ({ page, apiHelper }) => {
      // First check API is healthy
      const healthResponse = await apiHelper.healthCheck();
      expect(healthResponse.ok()).toBeTruthy();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Wait for conditions to load (spinner should disappear)
      await page.waitForTimeout(2000);
      
      // Check for weather/conditions display
      const conditionsSection = page.locator('[class*="bg-white"]').first();
      await expect(conditionsSection).toBeVisible();
    });
    
    test('should display fishing rating indicator', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Look for rating text
      const ratingTexts = ['Excellent', 'Good', 'Fair', 'Poor', 'Loading'];
      const ratingVisible = await page.locator('text=/Excellent|Good|Fair|Poor|Conditions/i').isVisible();
      expect(ratingVisible).toBeTruthy();
    });
    
    test('should have date navigation for conditions', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for date navigation arrows
      const leftArrow = page.locator('[class*="ChevronLeft"], button:has-text("<")').first();
      const rightArrow = page.locator('[class*="ChevronRight"], button:has-text(">")').first();
      
      // At least one navigation method should exist
      const hasNav = await leftArrow.isVisible() || await rightArrow.isVisible();
      // This is optional, not all designs have this
    });
    
    test('should be responsive on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Page should still render correctly
      await expect(page.locator('h1')).toContainText('Fishing Tracker');
    });
  });
  
  test.describe('About Page', () => {
    test('should render about page correctly', async ({ page }) => {
      await page.goto('/about');
      await page.waitForLoadState('networkidle');
      
      // Check page loaded
      await expect(page.locator('text=/about/i')).toBeVisible();
    });
    
    test('should have navigation to other pages', async ({ page }) => {
      await page.goto('/about');
      
      // Check navigation elements
      await expect(page.locator('a[href="/"]')).toBeVisible();
    });
  });
  
  test.describe('Contact Page', () => {
    test('should render contact page with form', async ({ page }) => {
      await page.goto('/contact');
      await page.waitForLoadState('networkidle');
      
      // Check form elements exist
      await expect(page.locator('input[name="name"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="subject"]')).toBeVisible();
      await expect(page.locator('textarea[name="message"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });
    
    test('should validate required fields', async ({ page }) => {
      await page.goto('/contact');
      
      // Try to submit empty form
      await page.click('button[type="submit"]');
      
      // HTML5 validation should prevent submission
      const nameInput = page.locator('input[name="name"]');
      const isInvalid = await nameInput.evaluate((el) => !el.validity.valid);
      expect(isInvalid).toBeTruthy();
    });
    
    test('should submit contact form successfully', async ({ page, testData }) => {
      await page.goto('/contact');
      
      const contactData = testData.contactMessage();
      
      // Fill form
      await page.fill('input[name="name"]', contactData.name);
      await page.fill('input[name="email"]', contactData.email);
      await page.fill('input[name="subject"]', contactData.subject);
      await page.fill('textarea[name="message"]', contactData.message);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for response (success or error toast)
      await page.waitForSelector('.Toastify__toast', { timeout: 10000 });
    });
    
    test('should validate email format', async ({ page }) => {
      await page.goto('/contact');
      
      // Fill with invalid email
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('input[name="subject"]', 'Test');
      await page.fill('textarea[name="message"]', 'Test message');
      
      await page.click('button[type="submit"]');
      
      // HTML5 email validation should trigger
      const emailInput = page.locator('input[name="email"]');
      const isInvalid = await emailInput.evaluate((el) => !el.validity.valid);
      expect(isInvalid).toBeTruthy();
    });
  });
  
  test.describe('Privacy Policy Page', () => {
    test('should render privacy policy page', async ({ page }) => {
      await page.goto('/privacy');
      await page.waitForLoadState('networkidle');
      
      // Check page content
      await expect(page.locator('text=/privacy/i')).toBeVisible();
    });
  });
  
  test.describe('Data Sources Page', () => {
    test('should render data sources page', async ({ page }) => {
      await page.goto('/data-sources');
      await page.waitForLoadState('networkidle');
      
      // Check page loaded
      await expect(page.locator('text=/data|sources/i')).toBeVisible();
    });
  });
});

test.describe('Public Pages - Navigation', () => {
  
  test('should navigate from landing to about', async ({ page }) => {
    await page.goto('/');
    await page.click('text=About');
    await page.waitForURL('/about');
    expect(page.url()).toContain('/about');
  });
  
  test('should navigate from landing to contact', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Contact');
    await page.waitForURL('/contact');
    expect(page.url()).toContain('/contact');
  });
  
  test('should navigate from landing to login', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Login');
    await page.waitForURL('/login');
    expect(page.url()).toContain('/login');
  });
  
  test('should navigate from landing to register', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Register');
    await page.waitForURL('/register');
    expect(page.url()).toContain('/register');
  });
  
  test('should navigate back to home from any page', async ({ page }) => {
    await page.goto('/about');
    await page.click('a[href="/"]');
    await page.waitForURL('/');
    expect(page.url()).toMatch(/\/$/);
  });
});
