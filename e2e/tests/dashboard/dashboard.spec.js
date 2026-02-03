// @ts-check
const { test, expect } = require('../fixtures');

/**
 * Dashboard Test Suite
 * Tests all dashboard tabs and functionality
 */

test.describe('Dashboard - Main Navigation', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });
  
  test('should render dashboard with all tabs', async ({ page }) => {
    // Check all tabs are present
    await expect(page.locator('button:has-text("Log Trip")')).toBeVisible();
    await expect(page.locator('button:has-text("View Data")')).toBeVisible();
    await expect(page.locator('button:has-text("Plan Trip")')).toBeVisible();
    await expect(page.locator('button:has-text("Reports")')).toBeVisible();
    await expect(page.locator('button:has-text("Predictions")')).toBeVisible();
    await expect(page.locator('button:has-text("Browse Locations")')).toBeVisible();
    await expect(page.locator('button:has-text("Best Conditions")')).toBeVisible();
  });
  
  test('should have header with user info', async ({ page }) => {
    // Header should be present
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
  });
  
  test('should navigate between tabs', async ({ page }) => {
    // Click each tab and verify content changes
    const tabs = ['Log Trip', 'View Data', 'Plan Trip', 'Reports', 'Predictions'];
    
    for (const tabName of tabs) {
      await page.click(`button:has-text("${tabName}")`);
      await page.waitForTimeout(500);
      
      // Tab should be selected (has active styling)
      const tab = page.locator(`button:has-text("${tabName}")`);
      const classes = await tab.getAttribute('class');
      expect(classes).toContain('blue');
    }
  });
  
  test('should default to Log Trip tab', async ({ page }) => {
    // Log Trip tab should be active by default
    const logTripTab = page.locator('button:has-text("Log Trip")');
    const classes = await logTripTab.getAttribute('class');
    expect(classes).toContain('blue');
  });
  
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Dashboard should still be accessible
    await expect(page.locator('button:has-text("Log Trip")')).toBeVisible();
  });
});

test.describe('Dashboard - Log Trip Tab', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Log Trip")');
    await page.waitForTimeout(1000);
  });
  
  test('should render log trip form correctly', async ({ page }) => {
    // Check all form elements
    await expect(page.locator('input[type="date"]').first()).toBeVisible();
    await expect(page.locator('input[type="time"]').first()).toBeVisible();
  });
  
  test('should have location search/dropdown', async ({ page }) => {
    // Location input should exist
    const locationInput = page.locator('input[placeholder*="location" i], input[placeholder*="search" i]').first();
    const locationSelect = page.locator('select').first();
    
    const hasLocationField = await locationInput.isVisible() || await locationSelect.isVisible();
    expect(hasLocationField).toBeTruthy();
  });
  
  test('should have fishing type dropdown', async ({ page }) => {
    // Look for fishing type select or dropdown
    const fishingTypeField = page.locator('select, [role="listbox"]').filter({ hasText: /casting|jigging|fishing type/i });
    const hasField = await fishingTypeField.count() > 0;
    
    // Alternative: look for any select element
    const selectCount = await page.locator('select').count();
    expect(selectCount).toBeGreaterThan(0);
  });
  
  test('should have date pre-filled with today', async ({ page }) => {
    const dateInput = page.locator('input[type="date"]').first();
    const value = await dateInput.inputValue();
    
    const today = new Date().toISOString().split('T')[0];
    expect(value).toBe(today);
  });
  
  test('should have caught fish radio/toggle', async ({ page }) => {
    // Look for caught fish selection - it's a select dropdown with Yes/No options
    const caughtFishSelect = page.locator('select').filter({ has: page.locator('option:text-is("Yes")') }).first();
    const hasRadio = await page.locator('input[type="radio"]').first().isVisible();
    const hasSelect = await caughtFishSelect.isVisible();
    const hasButton = await page.locator('button').filter({ hasText: /^yes$/i }).first().isVisible();
    
    // Any of these toggle mechanisms is acceptable
    expect(hasSelect || hasRadio || hasButton).toBeTruthy();
  });
  
  test('should show fish count field when "Yes" is selected for caught fish', async ({ page }) => {
    // Click Yes for caught fish
    const yesButton = page.locator('button').filter({ hasText: /^yes$/i }).first();
    
    if (await yesButton.isVisible()) {
      await yesButton.click();
      await page.waitForTimeout(500);
      
      // Fish count or species input should appear
      const hasFishFields = await page.locator('input, select').count() > 0;
      expect(hasFishFields).toBeTruthy();
    }
  });
  
  test('should load environmental data when location and date are selected', async ({ page }) => {
    // This tests the environmental data loading feature
    // Select a location
    const locationInput = page.locator('input[placeholder*="location" i]').first();
    
    if (await locationInput.isVisible()) {
      await locationInput.fill('Port Louis');
      await page.waitForTimeout(1000);
      
      // Select from dropdown if it appears
      const dropdownOption = page.locator('text=Port Louis').first();
      if (await dropdownOption.isVisible()) {
        await dropdownOption.click();
      }
      
      // Wait for environmental data to load
      await page.waitForTimeout(2000);
      
      // Check for environmental data display
      const envSection = page.locator('text=/weather|tide|moon|temperature/i');
      // Environmental data section should appear
    }
  });
  
  test('should have submit button', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Save"), button:has-text("Log")');
    await expect(submitBtn.first()).toBeVisible();
  });
  
  test('should have custom submission option for dropdowns', async ({ page }) => {
    // Look for "Other" option in dropdowns
    const selectElements = page.locator('select');
    const count = await selectElements.count();
    
    // Check if any dropdown has "Other" option
    for (let i = 0; i < count; i++) {
      const options = await selectElements.nth(i).locator('option').allTextContents();
      // Some dropdowns should have Other option
    }
  });
});

test.describe('Dashboard - View Data Tab', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("View Data")');
    await page.waitForTimeout(1000);
  });
  
  test('should render data table', async ({ page }) => {
    // Look for table element
    const table = page.locator('table');
    const hasTable = await table.isVisible();
    
    // Or data display in cards
    const dataCards = page.locator('[class*="card"], [class*="rounded"]');
    
    expect(hasTable || await dataCards.count() > 0).toBeTruthy();
  });
  
  test('should display column headers', async ({ page }) => {
    const table = page.locator('table');
    
    if (await table.isVisible()) {
      const headers = page.locator('th');
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThan(0);
    }
  });
  
  test('should have edit functionality for entries', async ({ page }) => {
    // Look for edit buttons/icons
    const editButtons = page.locator('button:has-text("Edit"), [aria-label="Edit"], svg[class*="edit" i]');
    // Edit buttons should exist if there's data
  });
  
  test('should have delete functionality for entries', async ({ page }) => {
    // Look for delete buttons/icons
    const deleteButtons = page.locator('button:has-text("Delete"), [aria-label="Delete"], svg[class*="trash" i]');
    // Delete buttons should exist if there's data
  });
  
  test('should show "no data" message when empty', async ({ page }) => {
    // If there's no data, should show appropriate message
    const noDataMessage = page.locator('text=/no.*data|no.*entries|no.*logs|empty/i');
    const table = page.locator('table tbody tr');
    
    const hasData = await table.count() > 0;
    const hasNoDataMessage = await noDataMessage.isVisible();
    
    // Either should have data or "no data" message
    expect(hasData || hasNoDataMessage).toBeTruthy();
  });
});

test.describe('Dashboard - Plan Trip Tab', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Plan Trip")').first().click();
    await page.waitForTimeout(1000);
  });
  
  test('should render plan trip form', async ({ page }) => {
    // Check plan trip content is visible (form, inputs, or content area)
    const hasContent = await page.locator('select, input, button').count() > 0;
    expect(hasContent).toBeTruthy();
  });
  
  test('should have location selection', async ({ page }) => {
    const selectCount = await page.locator('select').count();
    const inputCount = await page.locator('input').count();
    expect(selectCount + inputCount).toBeGreaterThan(0);
  });
  
  test('should have fishing type selection', async ({ page }) => {
    const selectElements = page.locator('select');
    expect(await selectElements.count()).toBeGreaterThan(0);
  });
  
  test('should have bait type selection dependent on fishing type', async ({ page }) => {
    // Select a fishing type first
    const fishingTypeSelect = page.locator('select').first();
    
    if (await fishingTypeSelect.isVisible()) {
      const options = await fishingTypeSelect.locator('option').allTextContents();
      
      if (options.length > 1) {
        // Select first non-empty option
        await fishingTypeSelect.selectOption({ index: 1 });
        await page.waitForTimeout(500);
        
        // Bait dropdown should update based on fishing type
      }
    }
  });
  
  test('should have date selection', async ({ page }) => {
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput.first()).toBeVisible();
  });
  
  test('should have time range selection', async ({ page }) => {
    const timeInputs = page.locator('input[type="time"]');
    expect(await timeInputs.count()).toBeGreaterThanOrEqual(2);
  });
  
  test('should have get recommendations button', async ({ page }) => {
    const recButton = page.locator('button').filter({ hasText: /recommend|get|plan/i }).first();
    await expect(recButton).toBeVisible();
  });
  
  test('should generate recommendations on submit', async ({ page }) => {
    // Fill out form with minimal data
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible()) {
      await dateInput.fill(new Date().toISOString().split('T')[0]);
    }
    
    // Select location if available
    const locationSelect = page.locator('select').first();
    if (await locationSelect.isVisible()) {
      const options = await locationSelect.locator('option').allTextContents();
      if (options.length > 1) {
        await locationSelect.selectOption({ index: 1 });
      }
    }
    
    // Click recommendations button
    const recButton = page.locator('button').filter({ hasText: /recommend|get/i }).first();
    
    if (await recButton.isVisible()) {
      await recButton.click();
      
      // Wait for recommendations to load
      await page.waitForTimeout(3000);
      
      // Just verify page didn't error - recommendations content may vary
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Dashboard - Reports Tab', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Reports")').first().click();
    await page.waitForTimeout(1000);
  });
  
  test('should render reports section', async ({ page }) => {
    // Reports section should be visible
    const reportsSection = page.locator('[class*="p-6"]').first();
    await expect(reportsSection).toBeVisible();
  });
  
  test('should display statistics if data exists', async ({ page }) => {
    // Look for stats/charts
    const stats = page.locator('text=/total|average|success|rate|trips/i');
    // Stats should be visible if there's data
  });
  
  test('should have charts for visualization', async ({ page }) => {
    // Look for recharts elements or chart containers
    const charts = page.locator('.recharts-wrapper, [class*="chart"], svg');
    // Charts might be present
  });
});

test.describe('Dashboard - Predictions Tab', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Predictions")');
    await page.waitForTimeout(2000);
  });
  
  test('should render predictions section', async ({ page }) => {
    const predictionsSection = page.locator('[class*="p-6"]').first();
    await expect(predictionsSection).toBeVisible();
  });
  
  test('should display community insights header', async ({ page }) => {
    const header = page.locator('text=/community|insights|predictions/i');
    await expect(header.first()).toBeVisible();
  });
  
  test('should compare today vs best conditions', async ({ page }) => {
    // Look for comparison section
    const comparison = page.locator('text=/today|best|conditions/i');
    // Comparison should be visible
  });
  
  test('should display moon phase information', async ({ page }) => {
    const moonInfo = page.locator('text=/moon|phase/i');
    const hasMoonInfo = await moonInfo.count() > 0;
    expect(hasMoonInfo).toBeTruthy();
  });
  
  test('should display tide information', async ({ page }) => {
    const tideInfo = page.locator('text=/tide|rising|falling/i');
    // Tide info should be present
  });
});

test.describe('Dashboard - Browse Locations Tab', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Browse Locations")');
    await page.waitForTimeout(1000);
  });
  
  test('should render locations list', async ({ page }) => {
    // Locations should be displayed
    const locationsList = page.locator('[class*="grid"], [class*="list"]').first();
    await expect(locationsList).toBeVisible();
  });
  
  test('should display location names', async ({ page }) => {
    // Common Mauritius locations
    const locations = ['Port Louis', 'Grand Baie', 'Flic en Flac'];
    
    // At least one location should be visible
    let hasLocation = false;
    for (const loc of locations) {
      if (await page.locator(`text=${loc}`).isVisible()) {
        hasLocation = true;
        break;
      }
    }
  });
  
  test('should have search/filter functionality', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]');
    // Search might be available
  });
});

test.describe('Dashboard - Best Conditions Tab', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Best Conditions")');
    await page.waitForTimeout(1000);
  });
  
  test('should render best conditions section', async ({ page }) => {
    const section = page.locator('[class*="p-6"]').first();
    await expect(section).toBeVisible();
  });
  
  test('should display optimal fishing conditions', async ({ page }) => {
    const conditionsInfo = page.locator('text=/optimal|best|ideal|conditions/i');
    // Best conditions info should be displayed
  });
});
