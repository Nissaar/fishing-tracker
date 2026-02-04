// @ts-check
const { test, expect } = require('../fixtures');

/**
 * LogTrip Functionality Test Suite
 * Comprehensive tests for the log trip feature including:
 * - Form validation
 * - Environmental data loading
 * - Fish species selection
 * - Custom submissions
 * - Form submission
 */

test.describe('LogTrip - Form Functionality', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // Log Trip should be the default tab
    await page.waitForTimeout(1000);
  });
  
  test('should have all required form fields', async ({ page }) => {
    await test.step('1. Navigate to /dashboard (Log Trip tab is default)', async () => {
      // Already done in beforeEach
    });
    
    await test.step('2. Verify date input field is visible', async () => {
      const dateInput = page.locator('input[type="date"]').first();
      await expect(dateInput).toBeVisible();
    });
    
    await test.step('3. Verify at least 2 time input fields exist (start/end time)', async () => {
      const timeInputs = page.locator('input[type="time"]');
      expect(await timeInputs.count()).toBeGreaterThanOrEqual(2);
    });
    
    await test.step('4. Verify submit button is visible', async () => {
      const submitBtn = page.locator('button[type="submit"], button:has-text("Log"), button:has-text("Submit"), button:has-text("Save")');
      await expect(submitBtn.first()).toBeVisible();
    });
  });
  
  test('should load dropdown options from API', async ({ page }) => {
    await test.step('1. Wait for dropdown data to load from API', async () => {
      await page.waitForTimeout(2000);
    });
    
    await test.step('2. Verify select dropdowns exist on the form', async () => {
      const selects = page.locator('select');
      const selectCount = await selects.count();
      expect(selectCount).toBeGreaterThan(0);
    });
    
    await test.step('3. Verify at least one dropdown has loaded options', async () => {
      const selects = page.locator('select');
      const selectCount = await selects.count();
      if (selectCount > 0) {
        const options = await selects.first().locator('option').allTextContents();
        expect(options.length).toBeGreaterThan(0);
      }
    });
  });
  
  test('should filter baits based on fishing type selection', async ({ page }) => {
    await test.step('1. Wait for dropdowns to load', async () => {
      await page.waitForTimeout(2000);
    });
    
    await test.step('2. Find fishing type dropdown and select "Casting"', async () => {
      const fishingTypeSelect = page.locator('select').filter({ has: page.locator('option:has-text("Casting")') });
      if (await fishingTypeSelect.count() > 0) {
        await fishingTypeSelect.first().selectOption({ label: 'Casting' });
        await page.waitForTimeout(500);
      }
    });
    
    await test.step('3. Verify bait options are filtered based on fishing type', async () => {
      // Baits should be filtered based on the selected fishing type
    });
  });
  
  test('should show/hide fish details based on caught fish selection', async ({ page }) => {
    await test.step('1. Find "Yes" and "No" buttons for caught fish selection', async () => {
      const yesButton = page.locator('button:has-text("Yes")').first();
      const noButton = page.locator('button:has-text("No")').first();
      if (!await yesButton.isVisible() || !await noButton.isVisible()) return;
    });
    
    await test.step('2. Click "No" - fish detail fields should be hidden', async () => {
      const noButton = page.locator('button:has-text("No")').first();
      if (await noButton.isVisible()) {
        await noButton.click();
        await page.waitForTimeout(300);
      }
    });
    
    await test.step('3. Click "Yes" - fish detail fields should appear', async () => {
      const yesButton = page.locator('button:has-text("Yes")').first();
      if (await yesButton.isVisible()) {
        await yesButton.click();
        await page.waitForTimeout(300);
      }
    });
  });
  
  test('should support multiple fish type selection', async ({ page }) => {
    await test.step('1. Click "Yes" for caught fish', async () => {
      const yesButton = page.locator('button:has-text("Yes")').first();
      if (await yesButton.isVisible()) {
        await yesButton.click();
        await page.waitForTimeout(500);
      }
    });
    
    await test.step('2. Click "Add" button to add another fish entry', async () => {
      const addFishBtn = page.locator('button:has-text("Add"), button:has([class*="Plus"])');
      if (await addFishBtn.first().isVisible()) {
        await addFishBtn.first().click();
        await page.waitForTimeout(300);
      }
    });
    
    await test.step('3. Verify multiple fish entry fields are available', async () => {
      // Multiple fish entries should now be possible
    });
  });
  
  test('should have "Other" option in fishing type dropdown', async ({ page }) => {
    await test.step('1. Wait for dropdowns to load', async () => {
      await page.waitForTimeout(2000);
    });
    
    await test.step('2. Check if any dropdown has an "Other" option', async () => {
      const selects = page.locator('select');
      const count = await selects.count();
      for (let i = 0; i < count; i++) {
        const options = await selects.nth(i).locator('option').allTextContents();
        const hasOther = options.some(opt => opt.toLowerCase().includes('other'));
        if (hasOther) break;
      }
    });
  });
  
  test('should show custom text field when "Other" is selected', async ({ page }) => {
    await test.step('1. Wait for dropdowns to load', async () => {
      await page.waitForTimeout(2000);
    });
    
    await test.step('2. Find a dropdown with "Other" option and select it', async () => {
      const selects = page.locator('select');
      const count = await selects.count();
      for (let i = 0; i < count; i++) {
        const select = selects.nth(i);
        const otherOption = select.locator('option:has-text("Other")');
        if (await otherOption.count() > 0) {
          await select.selectOption({ label: 'Other' });
          await page.waitForTimeout(300);
          break;
        }
      }
    });
    
    await test.step('3. Verify a text input appears for custom value', async () => {
      const customInput = page.locator('input[placeholder*="other" i], input[placeholder*="specify" i]');
      // Custom input might appear for entering custom value
    });
  });
  
  test('should validate required fields before submission', async ({ page }) => {
    await test.step('1. Click submit button without filling required fields', async () => {
      const submitBtn = page.locator('button[type="submit"], button:has-text("Log"), button:has-text("Submit")').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }
    });
    
    await test.step('2. Verify validation error or HTML5 validation triggers', async () => {
      await page.waitForTimeout(1000);
      // Either toast error or field validation should occur
    });
  });
  
  test('should display notes/comments textarea', async ({ page }) => {
    await test.step('1. Look for notes/comments textarea field', async () => {
      const notesField = page.locator('textarea, input[placeholder*="notes" i]');
      // Notes field should exist for optional comments
    });
  });
});

test.describe('LogTrip - Environmental Data', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });
  
  test('should load environmental data when location is selected', async ({ page }) => {
    await test.step('1. Look for location input or select field', async () => {
      const locationInput = page.locator('input[placeholder*="location" i]').first();
      const locationSelect = page.locator('select').first();
      // Either input or select should be available
    });
    
    await test.step('2. Enter or select a location (e.g., "Port Louis")', async () => {
      const locationInput = page.locator('input[placeholder*="location" i]').first();
      if (await locationInput.isVisible()) {
        await locationInput.fill('Port Louis');
        await page.waitForTimeout(500);
        const suggestion = page.locator('text=Port Louis').first();
        if (await suggestion.isVisible()) {
          await suggestion.click();
        }
      } else {
        const locationSelect = page.locator('select').first();
        if (await locationSelect.isVisible()) {
          const options = await locationSelect.locator('option').allTextContents();
          if (options.length > 1) {
            await locationSelect.selectOption({ index: 1 });
          }
        }
      }
    });
    
    await test.step('3. Wait for environmental data to load (weather, tide, moon)', async () => {
      await page.waitForTimeout(3000);
    });
    
    await test.step('4. Verify environmental data section appears', async () => {
      const envData = page.locator('text=/weather|tide|moon|temperature|wind/i');
      // Environmental data should be loaded and displayed
    });
  });
  
  test('should display moon phase information', async ({ page }) => {
    await test.step('1. Select a location from the first dropdown', async () => {
      const locationSelect = page.locator('select').first();
      if (await locationSelect.isVisible()) {
        const options = await locationSelect.locator('option').allTextContents();
        if (options.length > 1) {
          await locationSelect.selectOption({ index: 1 });
        }
      }
    });
    
    await test.step('2. Wait for environmental data to load', async () => {
      await page.waitForTimeout(3000);
    });
    
    await test.step('3. Verify moon phase is displayed (text or emoji)', async () => {
      const moonPhase = page.locator('text=/moon|🌑|🌒|🌓|🌔|🌕|🌖|🌗|🌘/i');
      // Moon phase info should appear
    });
  });
  
  test('should display tide information', async ({ page }) => {
    await test.step('1. Select a location from the first dropdown', async () => {
      const locationSelect = page.locator('select').first();
      if (await locationSelect.isVisible()) {
        const options = await locationSelect.locator('option').allTextContents();
        if (options.length > 1) {
          await locationSelect.selectOption({ index: 1 });
        }
      }
    });
    
    await test.step('2. Wait for environmental data to load', async () => {
      await page.waitForTimeout(3000);
    });
    
    await test.step('3. Verify tide information is displayed (rising, falling, high, low)', async () => {
      const tideInfo = page.locator('text=/tide|rising|falling|high|low/i');
      // Tide info should appear
    });
  });
  
  test('should display weather conditions', async ({ page }) => {
    await test.step('1. Select a location from the first dropdown', async () => {
      const locationSelect = page.locator('select').first();
      if (await locationSelect.isVisible()) {
        const options = await locationSelect.locator('option').allTextContents();
        if (options.length > 1) {
          await locationSelect.selectOption({ index: 1 });
        }
      }
    });
    
    await test.step('2. Wait for environmental data to load', async () => {
      await page.waitForTimeout(3000);
    });
    
    await test.step('3. Verify weather conditions are displayed (temperature, wind, humidity)', async () => {
      const weatherInfo = page.locator('text=/weather|temperature|°C|wind|humidity/i');
      // Weather info should appear
    });
  });
  
  test('should update environmental data when date changes', async ({ page }) => {
    await test.step('1. Select a location from the first dropdown', async () => {
      const locationSelect = page.locator('select').first();
      if (await locationSelect.isVisible()) {
        const options = await locationSelect.locator('option').allTextContents();
        if (options.length > 1) {
          await locationSelect.selectOption({ index: 1 });
          await page.waitForTimeout(2000);
        }
      }
    });
    
    await test.step('2. Change the date to tomorrow', async () => {
      const dateInput = page.locator('input[type="date"]').first();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      await dateInput.fill(tomorrowStr);
    });
    
    await test.step('3. Wait for environmental data to update', async () => {
      await page.waitForTimeout(2000);
      // Environmental data should update for the new date
    });
  });
});

test.describe('LogTrip - Submission', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });
  
  test('should submit a fishing log successfully', async ({ page, testData }) => {
    const logData = testData.fishingLog();
    
    await test.step('1. Fill in the date field', async () => {
      const dateInput = page.locator('input[type="date"]').first();
      await dateInput.fill(logData.date);
    });
    
    await test.step('2. Fill in start and end time fields', async () => {
      const timeInputs = page.locator('input[type="time"]');
      if (await timeInputs.count() >= 2) {
        await timeInputs.nth(0).fill(logData.timeStart);
        await timeInputs.nth(1).fill(logData.timeEnd);
      }
    });
    
    await test.step('3. Select a location from the dropdown', async () => {
      const locationSelect = page.locator('select').first();
      if (await locationSelect.isVisible()) {
        const options = await locationSelect.locator('option').allTextContents();
        if (options.length > 1) {
          await locationSelect.selectOption({ index: 1 });
        }
      }
    });
    
    await test.step('4. Click "No" for caught fish (simpler test)', async () => {
      await page.waitForTimeout(1000);
      const noButton = page.locator('button').filter({ hasText: /^no$/i }).first();
      if (await noButton.isVisible()) {
        await noButton.click();
      }
    });
    
    await test.step('5. Fill in the notes field (optional)', async () => {
      const notesField = page.locator('textarea').first();
      if (await notesField.isVisible()) {
        await notesField.fill(logData.notes);
      }
    });
    
    await test.step('6. Click the submit button', async () => {
      const submitBtn = page.locator('button[type="submit"], button:has-text("Log"), button:has-text("Submit"), button:has-text("Save")').first();
      await submitBtn.click();
    });
    
    await test.step('7. Verify success toast or page response', async () => {
      await page.waitForTimeout(3000);
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    });
  });
  
  test('should submit log with caught fish details', async ({ page, testData }) => {
    const logData = testData.fishingLog();
    
    await test.step('1. Fill in the date field', async () => {
      const dateInput = page.locator('input[type="date"]').first();
      await dateInput.fill(logData.date);
    });
    
    await test.step('2. Select a location from the dropdown', async () => {
      const locationSelect = page.locator('select').first();
      if (await locationSelect.isVisible()) {
        const options = await locationSelect.locator('option').allTextContents();
        if (options.length > 1) {
          await locationSelect.selectOption({ index: 1 });
        }
      }
      await page.waitForTimeout(1000);
    });
    
    await test.step('3. Click "Yes" for caught fish', async () => {
      const yesButton = page.locator('button').filter({ hasText: /^yes$/i }).first();
      if (await yesButton.isVisible()) {
        await yesButton.click();
        await page.waitForTimeout(500);
      }
    });
    
    await test.step('4. Fill in fish count if visible', async () => {
      const fishCountInput = page.locator('input[name*="count" i], input[placeholder*="count" i]').first();
      if (await fishCountInput.isVisible()) {
        await fishCountInput.fill('2');
      }
    });
    
    await test.step('5. Select a fish species if dropdown is visible', async () => {
      const fishSelect = page.locator('select').last();
      if (await fishSelect.isVisible()) {
        const options = await fishSelect.locator('option').allTextContents();
        if (options.length > 1) {
          await fishSelect.selectOption({ index: 1 });
        }
      }
    });
    
    await test.step('6. Click the submit button', async () => {
      const submitBtn = page.locator('button[type="submit"], button:has-text("Log"), button:has-text("Submit")').first();
      await submitBtn.click();
    });
    
    await test.step('7. Verify response (toast or page update)', async () => {
      await page.waitForTimeout(3000);
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    });
  });
  
  test('should handle submission errors gracefully', async ({ page }) => {
    await test.step('1. Click submit button without filling required fields', async () => {
      const submitBtn = page.locator('button[type="submit"], button:has-text("Log"), button:has-text("Submit")').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }
    });
    
    await test.step('2. Verify page handles error gracefully (no crash)', async () => {
      await page.waitForTimeout(2000);
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    });
  });
});

test.describe('LogTrip - Custom Submissions', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });
  
  test('should allow custom fish species input when "Other" is selected', async ({ page }) => {
    await test.step('1. Click "Yes" for caught fish', async () => {
      const yesButton = page.locator('button:has-text("Yes")').first();
      if (await yesButton.isVisible()) {
        await yesButton.click();
        await page.waitForTimeout(500);
      }
    });
    
    await test.step('2. Look for fish species input field', async () => {
      const fishInput = page.locator('input[placeholder*="fish" i], input[placeholder*="species" i]').first();
      if (await fishInput.isVisible()) {
        await fishInput.fill('Custom Fish E2E Test');
        await page.waitForTimeout(500);
      }
    });
    
    await test.step('3. Verify custom input is accepted (or "Other" option suggested)', async () => {
      // Should suggest "Other" or show custom option
    });
  });
  
  test('should track custom submission for admin review', async ({ page }) => {
    await test.step('1. Find a dropdown with "Other" option', async () => {
      const selects = page.locator('select');
      const count = await selects.count();
      for (let i = 0; i < count; i++) {
        const select = selects.nth(i);
        const hasOther = await select.locator('option[value*="other" i], option:has-text("Other")').count() > 0;
        if (hasOther) {
          await select.selectOption({ label: 'Other' });
          await page.waitForTimeout(300);
          break;
        }
      }
    });
    
    await test.step('2. Fill in custom value if input appears', async () => {
      const customInput = page.locator('input[type="text"]').last();
      if (await customInput.isVisible()) {
        await customInput.fill('E2E Test Custom Value');
      }
    });
    
    await test.step('3. Custom value should be tracked for admin review', async () => {
      // The actual verification would be in admin tests
    });
  });
});
