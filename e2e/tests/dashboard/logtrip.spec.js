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

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'e2etest@fishingtracker.mu',
  password: process.env.TEST_USER_PASSWORD || 'password'
};

const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@fishingtracker.mu',
  password: process.env.TEST_ADMIN_PASSWORD || 'password'
};

/** Open the dashboard; Log Trip is the default tab. */
const openLogTrip = async (page) => {
  await page.goto('/dashboard');
  await expect(page.getByLabel('Date')).toBeVisible();
};

/** Pick a location from the suggestions and wait for its conditions to load. */
const pickLocation = async (page, name) => {
  await page.getByRole('combobox', { name: 'Location' }).fill(name);
  const conditions = page.waitForResponse(r => r.url().includes('/api/fishing/environmental-data') && r.ok());
  await page.locator('#log-location-list').getByRole('button', { name: new RegExp(name) }).click();
  await conditions;
  await expect(page.getByRole('button', { name: 'Save Fishing Log' })).toBeEnabled();
};

const baitOptions = (page) => page.locator('#log-bait option').allTextContents();

/** Find the test user's logs whose notes match, through the API. */
const findLogsByNotes = async (apiHelper, token, notes) => {
  const response = await apiHelper.getFishingLogs(token, 100);
  expect(response.ok()).toBeTruthy();
  const { logs } = await response.json();
  return logs.filter(log => log.notes === notes);
};

test.describe('LogTrip - Form Functionality', () => {

  test.beforeEach(async ({ page }) => {
    await openLogTrip(page);
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
      await expect(page.getByLabel('Trip Start Time')).toBeVisible();
      await expect(page.getByLabel('Trip End Time')).toBeVisible();
    });

    await test.step('4. Verify submit button is visible', async () => {
      await expect(page.getByRole('button', { name: 'Save Fishing Log' })).toBeVisible();
    });
  });

  test('should load dropdown options from API', async ({ page }) => {
    await test.step('1. Verify the fishing method select lists the methods from the API', async () => {
      const method = page.getByLabel('Fishing Method', { exact: true });
      await expect(method).toBeVisible();
      // The seed data holds both "Land" and "land", so only check they are present
      await expect(method.locator('option', { hasText: 'Land' }).first()).toBeAttached();
      await expect(method.locator('option', { hasText: 'Boat' }).first()).toBeAttached();
    });

    await test.step('2. Verify the fishing types from the API are offered as chips', async () => {
      await expect(page.getByRole('button', { name: 'Casting', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Jigging', exact: true })).toBeVisible();
    });
  });

  test('should filter baits based on fishing type selection', async ({ page }) => {
    let castingBaits;

    await test.step('1. Verify there is no bait field before a fishing type is chosen', async () => {
      await expect(page.locator('#log-bait')).toHaveCount(0);
    });

    await test.step('2. Select "Casting"', async () => {
      await page.getByRole('button', { name: 'Casting', exact: true }).click();
      await expect(page.getByText('(showing baits for Casting)')).toBeVisible();
      await expect.poll(async () => (await baitOptions(page)).length).toBeGreaterThan(2);
      castingBaits = await baitOptions(page);
    });

    await test.step('3. Switch to "Jigging" and verify the bait list changes', async () => {
      await page.getByRole('button', { name: 'Casting', exact: true }).click();
      await page.getByRole('button', { name: 'Jigging', exact: true }).click();
      await expect(page.getByText('(showing baits for Jigging)')).toBeVisible();
      await expect.poll(() => baitOptions(page)).not.toEqual(castingBaits);
    });
  });

  test('should show/hide fish details based on caught fish selection', async ({ page }) => {
    const caught = page.getByLabel('Did you catch fish?');

    await test.step('1. Verify "No" is selected and fish details are hidden', async () => {
      await expect(caught).toHaveValue('no');
      await expect(page.getByLabel('How many fish?')).toHaveCount(0);
    });

    await test.step('2. Select "Yes" - fish detail fields should appear', async () => {
      await caught.selectOption('yes');
      await expect(page.getByLabel('How many fish?')).toBeVisible();
    });

    await test.step('3. Select "No" again - fish detail fields should be hidden', async () => {
      await caught.selectOption('no');
      await expect(page.getByLabel('How many fish?')).toHaveCount(0);
    });
  });

  test('should support multiple fish type selection', async ({ page }) => {
    await test.step('1. Select "Yes" for caught fish and enter 3 fish', async () => {
      await page.getByLabel('Did you catch fish?').selectOption('yes');
      await page.getByLabel('How many fish?').fill('3');
    });

    await test.step('2. Verify one species field per fish', async () => {
      for (const n of [1, 2, 3]) {
        await expect(page.getByLabel(`Fish ${n}`)).toBeVisible();
      }
    });

    await test.step('3. Pick a different species for the first two fish', async () => {
      await page.getByLabel('Fish 1').click();
      await page.locator('#fish-dropdown-0').getByRole('option').nth(0).click();
      await page.getByLabel('Fish 2').click();
      await page.locator('#fish-dropdown-1').getByRole('option').nth(1).click();
    });

    await test.step('4. Verify each field kept its own choice', async () => {
      const first = await page.getByLabel('Fish 1').inputValue();
      const second = await page.getByLabel('Fish 2').inputValue();
      expect(first).not.toBe('');
      expect(second).not.toBe('');
      expect(second).not.toBe(first);
      await expect(page.getByLabel('Fish 3')).toHaveValue('');
    });
  });

  test('should have "Other" option in fishing type dropdown', async ({ page }) => {
    await test.step('1. Verify the fishing types include an "Other" chip', async () => {
      await expect(page.getByRole('button', { name: '➕ Other', exact: true })).toHaveAttribute('aria-pressed', 'false');
    });

    await test.step('2. Verify the fishing method select has an "Other" option', async () => {
      await expect(page.getByLabel('Fishing Method', { exact: true }).locator('option', { hasText: 'Other (specify)' })).toHaveCount(1);
    });
  });

  test('should show custom text field when "Other" is selected', async ({ page }) => {
    await test.step('1. Select the "Other" fishing type', async () => {
      await page.getByRole('button', { name: '➕ Other', exact: true }).click();
    });

    await test.step('2. Verify a text input appears for the custom fishing type', async () => {
      await expect(page.getByPlaceholder('Specify the other fishing type...')).toBeVisible();
    });

    await test.step('3. Select "Other" as the fishing method and verify its text input appears', async () => {
      await page.getByLabel('Fishing Method', { exact: true }).selectOption('other');
      await expect(page.getByLabel('Other fishing method')).toBeVisible();
    });
  });

  test('should validate required fields before submission', async ({ page }) => {
    await test.step('1. Verify saving is disabled before a location is chosen', async () => {
      await expect(page.getByRole('button', { name: 'Save Fishing Log' })).toBeDisabled();
    });

    await test.step('2. Pick a location but no fishing type, then click Save', async () => {
      await pickLocation(page, 'Grand Baie');
      await page.getByRole('button', { name: 'Save Fishing Log' }).click();
    });

    await test.step('3. Verify the missing fishing type is reported', async () => {
      await expect(page.locator('.Toastify__toast--error')).toContainText('Please select at least one type of fishing');
    });
  });

  test('should display notes/comments textarea', async ({ page }) => {
    await test.step('1. Verify the notes field is visible and editable', async () => {
      const notes = page.getByLabel('Notes (Optional)');
      await expect(notes).toBeVisible();
      await notes.fill('Calm morning');
      await expect(notes).toHaveValue('Calm morning');
    });
  });
});

test.describe('LogTrip - Environmental Data', () => {

  test.beforeEach(async ({ page }) => {
    await openLogTrip(page);
  });

  test('should load environmental data when location is selected', async ({ page }) => {
    await test.step('1. Verify no conditions are shown before a location is chosen', async () => {
      await expect(page.getByText('Moon Phase', { exact: true })).toHaveCount(0);
    });

    await test.step('2. Pick "Grand Baie" from the location suggestions', async () => {
      await pickLocation(page, 'Grand Baie');
    });

    await test.step('3. Verify environmental data section appears', async () => {
      for (const label of ['Moon Phase', 'Tide Height', 'Weather', 'Sea Temp', 'Fish Activity']) {
        await expect(page.getByText(label, { exact: true })).toBeVisible();
      }
    });
  });

  test('should display moon phase information', async ({ page }) => {
    await test.step('1. Pick a location', async () => {
      await pickLocation(page, 'Grand Baie');
    });

    await test.step('2. Verify moon phase and illumination are displayed', async () => {
      await expect(page.getByText('Moon Phase', { exact: true })).toBeVisible();
      await expect(page.getByText(/^\d+% illuminated$/)).toBeVisible();
    });
  });

  test('should display tide information', async ({ page }) => {
    await test.step('1. Pick a location', async () => {
      await pickLocation(page, 'Grand Baie');
    });

    await test.step('2. Verify tide height is displayed', async () => {
      const tide = page.getByText('Tide Height', { exact: true }).locator('xpath=following-sibling::p[1]');
      await expect(tide).toHaveText(/^(-?\d+(\.\d+)?m|Unavailable)$/);
    });
  });

  test('should display weather conditions', async ({ page }) => {
    await test.step('1. Pick a location', async () => {
      await pickLocation(page, 'Grand Baie');
    });

    await test.step('2. Verify the weather temperature is displayed', async () => {
      const weather = page.getByText('Weather', { exact: true }).locator('xpath=following-sibling::p[1]');
      await expect(weather).toContainText('°C');
    });
  });

  test('should update environmental data when date changes', async ({ page }) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-CA');

    await test.step('1. Pick a location', async () => {
      await pickLocation(page, 'Grand Baie');
    });

    await test.step('2. Change the date to yesterday', async () => {
      const refetch = page.waitForResponse(r =>
        r.url().includes('/api/fishing/environmental-data') && r.url().includes(`date=${yesterdayStr}`));
      await page.getByLabel('Date').fill(yesterdayStr);
      expect((await refetch).ok()).toBeTruthy();
    });

    await test.step('3. Verify conditions for the new date are shown', async () => {
      await expect(page.getByText('Moon Phase', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Save Fishing Log' })).toBeEnabled();
    });
  });
});

test.describe('LogTrip - Submission', () => {

  test.beforeEach(async ({ page }) => {
    await openLogTrip(page);
  });

  test('should submit a fishing log successfully', async ({ page, testData, apiHelper }) => {
    const logData = testData.fishingLog();

    await test.step('1. Fill in the date field', async () => {
      await page.getByLabel('Date').fill(logData.date);
    });

    await test.step('2. Fill in start and end time fields', async () => {
      await page.getByLabel('Trip Start Time').fill(logData.timeStart);
      await page.getByLabel('Trip End Time').fill(logData.timeEnd);
    });

    await test.step('3. Pick a location', async () => {
      await pickLocation(page, 'Grand Baie');
    });

    await test.step('4. Select "Casting" and leave "No" for caught fish', async () => {
      await page.getByRole('button', { name: 'Casting', exact: true }).click();
      await expect(page.getByLabel('Did you catch fish?')).toHaveValue('no');
    });

    await test.step('5. Fill in the notes field', async () => {
      await page.getByLabel('Notes (Optional)').fill(logData.notes);
    });

    await test.step('6. Click the submit button', async () => {
      const saved = page.waitForResponse(r => r.url().includes('/api/fishing/logs') && r.request().method() === 'POST');
      await page.getByRole('button', { name: 'Save Fishing Log' }).click();
      expect((await saved).status()).toBe(201);
    });

    await test.step('7. Verify success toast and that the form was reset', async () => {
      await expect(page.locator('.Toastify__toast--success')).toContainText('Fishing log saved successfully!');
      await expect(page.getByRole('combobox', { name: 'Location' })).toHaveValue('');
      await expect(page.getByLabel('Notes (Optional)')).toHaveValue('');
    });

    await test.step('8. Verify the trip was stored, then remove it', async () => {
      const token = await apiHelper.login(TEST_USER.email, TEST_USER.password);
      const [log] = await findLogsByNotes(apiHelper, token, logData.notes);
      expect(log).toBeDefined();
      expect(log.location_name).toBe('Grand Baie');
      expect(log.caught_fish).toBe(false);
      await apiHelper.deleteFishingLog(token, log.id);
    });
  });

  test('should submit log with caught fish details', async ({ page, testData, apiHelper }) => {
    const logData = testData.fishingLog();

    await test.step('1. Pick a location and a fishing type', async () => {
      await pickLocation(page, 'Grand Baie');
      await page.getByRole('button', { name: 'Casting', exact: true }).click();
    });

    await test.step('2. Select "Yes" for caught fish and enter 2 fish', async () => {
      await page.getByLabel('Did you catch fish?').selectOption('yes');
      await page.getByLabel('How many fish?').fill('2');
    });

    await test.step('3. Pick a species for each fish', async () => {
      for (const index of [0, 1]) {
        await page.getByLabel(`Fish ${index + 1}`).click();
        await page.locator(`#fish-dropdown-${index}`).getByRole('option').first().click();
        await expect(page.getByLabel(`Fish ${index + 1}`)).not.toHaveValue('');
      }
    });

    await test.step('4. Fill in the notes field', async () => {
      await page.getByLabel('Notes (Optional)').fill(logData.notes);
    });

    await test.step('5. Click the submit button', async () => {
      const saved = page.waitForResponse(r => r.url().includes('/api/fishing/logs') && r.request().method() === 'POST');
      await page.getByRole('button', { name: 'Save Fishing Log' }).click();
      expect((await saved).status()).toBe(201);
    });

    await test.step('6. Verify the success toast', async () => {
      await expect(page.locator('.Toastify__toast--success')).toContainText('Fishing log saved successfully!');
    });

    await test.step('7. Verify the catch was stored, then remove it', async () => {
      const token = await apiHelper.login(TEST_USER.email, TEST_USER.password);
      const [log] = await findLogsByNotes(apiHelper, token, logData.notes);
      expect(log).toBeDefined();
      expect(log.caught_fish).toBe(true);
      expect(log.fish_count).toBe(2);
      expect(log.fish_types).toHaveLength(2);
      await apiHelper.deleteFishingLog(token, log.id);
    });
  });

  test('should handle submission errors gracefully', async ({ page }) => {
    await test.step('1. Make the save request fail', async () => {
      await page.route('**/api/fishing/logs', async (route) => {
        if (route.request().method() !== 'POST') return route.continue();
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'E2E simulated failure' }) });
      });
    });

    await test.step('2. Fill the form and click Save', async () => {
      await pickLocation(page, 'Grand Baie');
      await page.getByRole('button', { name: 'Casting', exact: true }).click();
      await page.getByRole('button', { name: 'Save Fishing Log' }).click();
    });

    await test.step('3. Verify the API error is shown and the form keeps its values', async () => {
      await expect(page.locator('.Toastify__toast--error')).toContainText('E2E simulated failure');
      await expect(page.getByRole('combobox', { name: 'Location' })).toHaveValue('Grand Baie');
      await expect(page.getByRole('button', { name: 'Casting', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByRole('button', { name: 'Save Fishing Log' })).toBeEnabled();
    });
  });
});

test.describe('LogTrip - Custom Submissions', () => {

  test.beforeEach(async ({ page }) => {
    await openLogTrip(page);
  });

  test('should allow custom fish species input when "Other" is selected', async ({ page }) => {
    const species = `E2E Custom Fish ${Date.now()}`;

    await test.step('1. Select "Yes" for caught fish and enter 1 fish', async () => {
      await page.getByLabel('Did you catch fish?').selectOption('yes');
      await page.getByLabel('How many fish?').fill('1');
    });

    await test.step('2. Type a species that is not in the list', async () => {
      await page.getByLabel('Fish 1').fill(species);
    });

    await test.step('3. Verify it is offered as a new species and can be chosen', async () => {
      const addNew = page.locator('#fish-dropdown-0').getByRole('option', { name: `➕ Add "${species}" as new species` });
      await expect(addNew).toBeVisible();
      await addNew.click();
      await expect(page.locator('#fish-dropdown-0')).toHaveCount(0);
      await expect(page.getByLabel('Fish 1')).toHaveValue(species);
    });
  });

  test('should track custom submission for admin review', async ({ page, apiHelper, request }) => {
    const value = `E2E_TEST_Method_${Date.now()}`;

    await test.step('1. Open the custom fishing method dialog', async () => {
      await page.getByRole('button', { name: 'Add custom fishing method' }).click();
      await expect(page.getByRole('dialog')).toContainText('Submit Custom Fishing Method');
    });

    await test.step('2. Enter a custom value and submit it', async () => {
      await page.getByRole('dialog').getByLabel('Value *').fill(value);
      const submitted = page.waitForResponse(r => r.url().includes('/api/fishing/custom-submission'));
      await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();
      expect((await submitted).status()).toBe(201);
    });

    await test.step('3. Verify the dialog closes with a confirmation', async () => {
      await expect(page.locator('.Toastify__toast--success')).toContainText('submitted for admin review');
      await expect(page.getByRole('dialog')).toHaveCount(0);
    });

    await test.step('4. Verify the submission is pending in the admin review list', async () => {
      const adminToken = await apiHelper.login(TEST_ADMIN.email, TEST_ADMIN.password);
      const response = await request.get(`${apiHelper.url}/admin/submissions`, {
        headers: apiHelper.getAuthHeaders(adminToken)
      });
      expect(response.ok()).toBeTruthy();
      const { submissions } = await response.json();
      const submission = submissions.find(s => s.submitted_value === value);
      expect(submission).toMatchObject({ submission_type: 'fishing_method', status: 'pending' });
    });
  });
});
