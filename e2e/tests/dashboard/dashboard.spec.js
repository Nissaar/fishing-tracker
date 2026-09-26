// @ts-check
const { test, expect } = require('../fixtures');

/**
 * Dashboard Test Suite
 * Tests all dashboard tabs and functionality
 *
 * Manual Testing Guide:
 * 1. Login with test user: e2etest@fishingtracker.mu / password
 * 2. Dashboard has 7 tabs:
 *    - Log Trip: Record fishing sessions
 *    - View Data: See logged trips in table
 *    - Plan Trip: Get recommendations for future trips
 *    - Reports: View statistics and charts
 *    - Predictions: See community insights
 *    - Browse Locations: Explore all fishing spots
 *    - Best Conditions: Historical analysis
 * 3. All endpoints require authentication
 *
 * Detailed steps: See TEST_DOCUMENTATION.md
 */

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'e2etest@fishingtracker.mu',
  password: process.env.TEST_USER_PASSWORD || 'password',
  username: 'E2E Test User'
};

/** Today in the browser's (and this machine's) local time, as YYYY-MM-DD. */
const localToday = () => new Date().toLocaleDateString('en-CA');

/**
 * Log a successful trip for the test user through the API, so tabs that only
 * show something once there is data have data to show.
 * @returns {Promise<{ token: string, id: string }>}
 */
const seedSuccessfulLog = async (apiHelper, overrides = {}) => {
  const token = await apiHelper.login(TEST_USER.email, TEST_USER.password);
  const response = await apiHelper.createFishingLog(token, {
    date: new Date().toISOString().split('T')[0],
    timeStart: '06:00',
    timeEnd: '09:00',
    location: 'grand-baie',
    caughtFish: true,
    fishCount: 2,
    fishTypes: ['Carangue'],
    fishingTypes: ['Casting'],
    fishingMethod: 'land',
    notes: 'E2E_TEST dashboard seed',
    ...overrides
  });
  expect(response.status()).toBe(201);
  return { token, id: (await response.json()).log.id };
};

/** Open the dashboard on the given tab. */
const openTab = async (page, name) => {
  await page.goto('/dashboard');
  const tab = page.locator(`button:has-text("${name}")`).first();
  await tab.click();
  await expect(tab).toHaveClass(/text-blue-600/);
};

test.describe('Dashboard - Main Navigation', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should render dashboard with all tabs', async ({ page }) => {
    await test.step('1. Navigate to /dashboard (authentication required)', async () => {
      // Already done in beforeEach
    });

    await test.step('2. Verify "Log Trip" tab is visible', async () => {
      await expect(page.locator('button:has-text("Log Trip")')).toBeVisible();
    });

    await test.step('3. Verify "View Data" tab is visible', async () => {
      await expect(page.locator('button:has-text("View Data")')).toBeVisible();
    });

    await test.step('4. Verify "Plan Trip" tab is visible', async () => {
      await expect(page.locator('button:has-text("Plan Trip")')).toBeVisible();
    });

    await test.step('5. Verify "Reports" tab is visible', async () => {
      await expect(page.locator('button:has-text("Reports")')).toBeVisible();
    });

    await test.step('6. Verify "Predictions" tab is visible', async () => {
      await expect(page.locator('button:has-text("Predictions")')).toBeVisible();
    });

    await test.step('7. Verify "Browse Locations" tab is visible', async () => {
      await expect(page.locator('button:has-text("Browse Locations")')).toBeVisible();
    });

    await test.step('8. Verify "Best Conditions" tab is visible', async () => {
      await expect(page.locator('button:has-text("Best Conditions")')).toBeVisible();
    });
  });

  test('should have header with user info', async ({ page }) => {
    const header = page.locator('header').first();

    await test.step('1. Verify header element is visible', async () => {
      await expect(header).toBeVisible();
    });

    await test.step('2. Verify it shows the signed-in user and a Logout button', async () => {
      await expect(header).toContainText(TEST_USER.username);
      await expect(header).toContainText(TEST_USER.email);
      await expect(header.getByRole('button', { name: 'Logout' })).toBeVisible();
    });

    await test.step('3. Verify a regular user gets no Admin link', async () => {
      await expect(header.getByRole('link', { name: 'Admin' })).toHaveCount(0);
    });
  });

  test('should navigate between tabs', async ({ page }) => {
    const tabs = ['Log Trip', 'View Data', 'Plan Trip', 'Reports', 'Predictions'];

    for (let i = 0; i < tabs.length; i++) {
      const tabName = tabs[i];
      await test.step(`${i + 1}. Click "${tabName}" tab and verify it becomes active (blue styling)`, async () => {
        await page.click(`button:has-text("${tabName}")`);
        await expect(page.locator(`button:has-text("${tabName}")`)).toHaveClass(/text-blue-600/);
      });
    }
  });

  test('should default to Log Trip tab', async ({ page }) => {
    await test.step('1. Check that "Log Trip" tab has active (blue) styling by default', async () => {
      await expect(page.locator('button:has-text("Log Trip")')).toHaveClass(/text-blue-600/);
    });
  });

  test('should be responsive on mobile', async ({ page }) => {
    await test.step('1. Set viewport to mobile size (375x667)', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    await test.step('2. Reload the page', async () => {
      await page.reload();
    });

    await test.step('3. Verify "Log Trip" tab is still visible on mobile', async () => {
      await expect(page.locator('button:has-text("Log Trip")')).toBeVisible();
    });
  });
});

test.describe('Dashboard - Log Trip Tab', () => {

  test.beforeEach(async ({ page }) => {
    await openTab(page, 'Log Trip');
    await expect(page.getByLabel('Date')).toBeVisible();
  });

  test('should render log trip form correctly', async ({ page }) => {
    await test.step('1. Click on "Log Trip" tab', async () => {
      // Already done in beforeEach
    });

    await test.step('2. Verify date input field is visible', async () => {
      await expect(page.locator('input[type="date"]').first()).toBeVisible();
    });

    await test.step('3. Verify time input field is visible', async () => {
      await expect(page.locator('input[type="time"]').first()).toBeVisible();
    });
  });

  test('should have location search/dropdown', async ({ page }) => {
    await test.step('1. Verify the location search field is visible', async () => {
      await expect(page.getByRole('combobox', { name: 'Location' })).toBeVisible();
    });

    await test.step('2. Type part of a name and verify matching suggestions appear', async () => {
      await page.getByRole('combobox', { name: 'Location' }).fill('Grand Baie');
      await expect(page.locator('#log-location-list').getByRole('button', { name: /Grand Baie/ })).toBeVisible();
    });
  });

  test('should have fishing type dropdown', async ({ page }) => {
    await test.step('1. Verify the fishing types are offered as selectable chips', async () => {
      await expect(page.getByText(/Types of Fishing/)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Casting', exact: true })).toHaveAttribute('aria-pressed', 'false');
    });
  });

  test('should have date pre-filled with today', async ({ page }) => {
    await test.step('1. Get the value of the date input field', async () => {
      await expect(page.getByLabel('Date')).toHaveValue(localToday());
    });
  });

  test('should have caught fish radio/toggle', async ({ page }) => {
    await test.step('1. Verify the "Did you catch fish?" select offers No and Yes, defaulting to No', async () => {
      const caught = page.getByLabel('Did you catch fish?');
      await expect(caught).toBeVisible();
      await expect(caught).toHaveValue('no');
      await expect(caught.locator('option')).toHaveText(['No', 'Yes']);
    });
  });

  test('should show fish count field when "Yes" is selected for caught fish', async ({ page }) => {
    await test.step('1. Verify the fish count is hidden while "No" is selected', async () => {
      await expect(page.getByLabel('How many fish?')).toHaveCount(0);
    });

    await test.step('2. Select "Yes" for caught fish', async () => {
      await page.getByLabel('Did you catch fish?').selectOption('yes');
    });

    await test.step('3. Verify the fish count field appears', async () => {
      await expect(page.getByLabel('How many fish?')).toBeVisible();
    });

    await test.step('4. Enter 2 and verify one species field per fish', async () => {
      await page.getByLabel('How many fish?').fill('2');
      await expect(page.getByLabel('Fish 1')).toBeVisible();
      await expect(page.getByLabel('Fish 2')).toBeVisible();
      await expect(page.getByLabel('Fish 3')).toHaveCount(0);
    });
  });

  test('should load environmental data when location and date are selected', async ({ page }) => {
    await test.step('1. Verify saving is blocked until conditions are loaded', async () => {
      await expect(page.getByRole('button', { name: 'Save Fishing Log' })).toBeDisabled();
    });

    await test.step('2. Type "Grand Baie" and pick it from the suggestions', async () => {
      await page.getByRole('combobox', { name: 'Location' }).fill('Grand Baie');
      const conditions = page.waitForResponse(r => r.url().includes('/api/fishing/environmental-data') && r.ok());
      await page.locator('#log-location-list').getByRole('button', { name: /Grand Baie/ }).click();
      await conditions;
    });

    await test.step('3. Verify environmental data is shown (moon, tide, weather)', async () => {
      await expect(page.getByText('Moon Phase', { exact: true })).toBeVisible();
      await expect(page.getByText('Tide Height', { exact: true })).toBeVisible();
      await expect(page.getByText('Weather', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Save Fishing Log' })).toBeEnabled();
    });
  });

  test('should have submit button', async ({ page }) => {
    await test.step('1. Verify submit/save/log button is visible', async () => {
      await expect(page.getByRole('button', { name: 'Save Fishing Log' })).toBeVisible();
    });
  });

  test('should have custom submission option for dropdowns', async ({ page }) => {
    await test.step('1. Click the "+" next to fishing types', async () => {
      await page.getByRole('button', { name: 'Add custom fishing type' }).click();
    });

    await test.step('2. Verify the custom submission dialog opens', async () => {
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText('Submit Custom Fishing Type');
      await expect(dialog.getByLabel('Value *')).toBeVisible();
    });

    await test.step('3. Cancel and verify the dialog closes', async () => {
      await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
    });
  });
});

test.describe('Dashboard - View Data Tab', () => {

  test.beforeEach(async ({ page }) => {
    await openTab(page, 'View Data');
    await expect(page.locator('table')).toBeVisible();
  });

  test('should render data table', async ({ page }) => {
    await test.step('1. Click on "View Data" tab', async () => {
      // Already done in beforeEach
    });

    await test.step('2. Verify the data table and its filters are shown', async () => {
      await expect(page.locator('table')).toBeVisible();
      await expect(page.getByPlaceholder('Search by location, bait, or fish type...')).toBeVisible();
      await expect(page.getByText(/^Showing \d+ of \d+ total logs$/)).toBeVisible();
    });
  });

  test('should display column headers', async ({ page }) => {
    await test.step('1. Check for table with column headers', async () => {
      await expect(page.locator('th')).toHaveText(
        ['Date', 'Time', 'Location', 'Caught', 'Fish', 'Moon', 'Tide', 'Bait', 'Type', 'Method', 'Actions'],
        { ignoreCase: true }
      );
    });
  });

  // No assertion possible: the View Data table has no edit control, only delete
  test.fixme('should have edit functionality for entries', async ({ page }) => {
    await test.step('1. Look for edit buttons or icons in the data table', async () => {
      const editButtons = page.locator('button:has-text("Edit"), [aria-label="Edit"], svg[class*="edit" i]');
      // Edit buttons should exist if there's data
    });
  });

  test('should have delete functionality for entries', async ({ page, apiHelper }) => {
    const notes = `E2E_TEST_delete_${Date.now()}`;
    let seeded;

    await test.step('1. Log a trip to delete and reload the table', async () => {
      seeded = await seedSuccessfulLog(apiHelper, { location: 'blue-bay', notes });
      await openTab(page, 'View Data');
    });

    const row = page.locator('tbody tr', { hasText: 'Blue Bay' }).first();
    let rowsBefore;

    await test.step('2. Verify the trip is listed with a delete button', async () => {
      await expect(row).toBeVisible();
      await expect(row.getByTitle('Delete')).toBeVisible();
      rowsBefore = await page.locator('tbody tr', { hasText: 'Blue Bay' }).count();
    });

    await test.step('3. Delete it and confirm', async () => {
      page.once('dialog', dialog => dialog.accept());
      await row.getByTitle('Delete').click();
    });

    await test.step('4. Verify it is removed', async () => {
      await expect(page.locator('.Toastify__toast--success')).toContainText('Log deleted');
      await expect(page.locator('tbody tr', { hasText: 'Blue Bay' })).toHaveCount(rowsBefore - 1);
      const check = await apiHelper.getFishingLogs(seeded.token, 100);
      const { logs } = await check.json();
      expect(logs.filter(l => l.notes === notes)).toHaveLength(0);
    });
  });

  test('should show "no data" message when empty', async ({ page }) => {
    await test.step('1. Search for something no trip matches', async () => {
      await page.getByPlaceholder('Search by location, bait, or fish type...').fill(`nothing_matches_${Date.now()}`);
    });

    await test.step('2. Verify the empty-state message is shown', async () => {
      await expect(page.getByText('No fishing logs found. Start logging your trips!')).toBeVisible();
      await expect(page.getByText(/^Showing 0 of \d+ total logs$/)).toBeVisible();
    });
  });
});

test.describe('Dashboard - Plan Trip Tab', () => {

  test.beforeEach(async ({ page }) => {
    await openTab(page, 'Plan Trip');
    await expect(page.getByRole('heading', { name: 'Plan Your Fishing Trip' })).toBeVisible();
  });

  test('should render plan trip form', async ({ page }) => {
    await test.step('1. Click on "Plan Trip" tab', async () => {
      // Already done in beforeEach
    });

    await test.step('2. Verify form elements are visible (inputs, selects, buttons)', async () => {
      for (const name of ['location', 'fishingType', 'baitType', 'fishingMethod']) {
        await expect(page.locator(`select[name="${name}"]`)).toBeVisible();
      }
      await expect(page.getByRole('button', { name: 'Get Recommendations' })).toBeVisible();
    });
  });

  test('should have location selection', async ({ page }) => {
    await test.step('1. Verify location selection lists the known locations', async () => {
      const location = page.locator('select[name="location"]');
      await expect(location).toBeVisible();
      await expect(location.locator('option', { hasText: 'Grand Baie' })).toHaveCount(1);
    });
  });

  test('should have fishing type selection', async ({ page }) => {
    await test.step('1. Verify fishing type dropdown lists the fishing types', async () => {
      const fishingType = page.locator('select[name="fishingType"]');
      await expect(fishingType).toBeVisible();
      await expect(fishingType.locator('option', { hasText: 'Casting' })).toHaveCount(1);
    });
  });

  test('should have bait type selection dependent on fishing type', async ({ page }) => {
    await test.step('1. Select "Casting" as the fishing type', async () => {
      await page.locator('select[name="fishingType"]').selectOption({ label: 'Casting' });
    });

    await test.step('2. Verify the bait dropdown says it is filtered for that type', async () => {
      await expect(page.getByText('(filtered for Casting)')).toBeVisible();
      await expect.poll(() => page.locator('select[name="baitType"] option').count()).toBeGreaterThan(1);
    });
  });

  test('should have date selection', async ({ page }) => {
    await test.step('1. Verify date input field is visible', async () => {
      const dateInput = page.locator('input[type="date"]');
      await expect(dateInput.first()).toBeVisible();
    });
  });

  test('should have time range selection', async ({ page }) => {
    await test.step('1. Verify at least 2 time input fields exist (start and end time)', async () => {
      const timeInputs = page.locator('input[type="time"]');
      expect(await timeInputs.count()).toBeGreaterThanOrEqual(2);
    });
  });

  test('should have get recommendations button', async ({ page }) => {
    await test.step('1. Verify "Get Recommendations" or similar button is visible', async () => {
      await expect(page.getByRole('button', { name: 'Get Recommendations' })).toBeEnabled();
    });
  });

  test('should generate recommendations on submit', async ({ page }) => {
    await test.step('1. Fill in the date field with today\'s date', async () => {
      await page.locator('input[type="date"]').first().fill(localToday());
    });

    await test.step('2. Select a location from the dropdown', async () => {
      await page.locator('select[name="location"]').selectOption({ label: 'Grand Baie' });
    });

    await test.step('3. Click the "Get Recommendations" button', async () => {
      const recommendations = page.waitForResponse(r => r.url().includes('/api/fishing/trip-recommendations'));
      await page.getByRole('button', { name: 'Get Recommendations' }).click();
      expect((await recommendations).ok()).toBeTruthy();
    });

    await test.step('4. Verify the trip analysis is shown', async () => {
      await expect(page.locator('.Toastify__toast--success')).toContainText('Recommendations generated successfully!');
      await expect(page.getByRole('heading', { name: 'Trip Analysis' })).toBeVisible();
      await expect(page.getByText('Predicted Success Rate')).toBeVisible();
    });
  });
});

test.describe('Dashboard - Reports Tab', () => {

  test.beforeEach(async ({ page }) => {
    await openTab(page, 'Reports');
  });

  test('should render reports section', async ({ page }) => {
    await test.step('1. Click on "Reports" tab', async () => {
      // Already done in beforeEach
    });

    await test.step('2. Verify reports section is visible', async () => {
      await expect(page.getByRole('heading', { name: 'Monthly Catch Statistics' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Catches by Moon Phase' })).toBeVisible();
    });
  });

  test('should display statistics if data exists', async ({ page, apiHelper }) => {
    let seeded;

    await test.step('1. Log a successful trip and reload the Reports tab', async () => {
      seeded = await seedSuccessfulLog(apiHelper);
      await openTab(page, 'Reports');
    });

    try {
      await test.step('2. Verify the statistic cards show the trip', async () => {
        const value = (label) => page.getByText(label, { exact: true }).locator('xpath=following-sibling::p[1]');
        for (const label of ['Total Trips', 'Successful Trips', 'Total Fish', 'Locations Visited']) {
          await expect(value(label)).toHaveText(/^\d+$/);
        }
        expect(Number(await value('Total Trips').textContent())).toBeGreaterThanOrEqual(1);
        expect(Number(await value('Successful Trips').textContent())).toBeGreaterThanOrEqual(1);
      });
    } finally {
      await apiHelper.deleteFishingLog(seeded.token, seeded.id);
    }
  });

  test('should have charts for visualization', async ({ page, apiHelper }) => {
    let seeded;

    await test.step('1. Log a successful trip and reload the Reports tab', async () => {
      seeded = await seedSuccessfulLog(apiHelper);
      await openTab(page, 'Reports');
    });

    try {
      await test.step('2. Verify both charts are drawn instead of the empty-state text', async () => {
        await expect(page.locator('.recharts-wrapper')).toHaveCount(2);
        await expect(page.getByText('No data yet')).toHaveCount(0);
        await expect(page.getByText('No catch data yet')).toHaveCount(0);
      });
    } finally {
      await apiHelper.deleteFishingLog(seeded.token, seeded.id);
    }
  });
});

test.describe('Dashboard - Predictions Tab', () => {
  let seeded;

  // Predictions only appear once the community has at least one successful trip
  test.beforeEach(async ({ page, apiHelper }) => {
    seeded = await seedSuccessfulLog(apiHelper);
    await openTab(page, 'Predictions');
    await expect(page.getByRole('heading', { name: 'Community Fishing Insights' })).toBeVisible();
  });

  test.afterEach(async ({ apiHelper }) => {
    if (seeded) await apiHelper.deleteFishingLog(seeded.token, seeded.id);
  });

  test('should render predictions section', async ({ page }) => {
    await test.step('1. Click on "Predictions" tab', async () => {
      // Already done in beforeEach
    });

    await test.step('2. Verify predictions section is visible', async () => {
      await expect(page.getByText(/^Based on \d+ successful fishing trips from the community$/)).toBeVisible();
    });
  });

  test('should display community insights header', async ({ page }) => {
    await test.step('1. Look for "Community Insights" or "Predictions" header', async () => {
      await expect(page.getByRole('heading', { name: 'Community Fishing Insights' })).toBeVisible();
    });
  });

  test('should compare today vs best conditions', async ({ page }) => {
    await test.step('1. Verify the today vs best comparison is shown', async () => {
      await expect(page.getByRole('heading', { name: /Today's Conditions vs Best Conditions/ })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Today', exact: true })).toBeVisible();
    });
  });

  test('should display moon phase information', async ({ page }) => {
    await test.step('1. Verify best moon phase is shown', async () => {
      await expect(page.getByRole('heading', { name: 'Best Moon Phase' })).toBeVisible();
    });
  });

  test('should display tide information', async ({ page }) => {
    await test.step('1. Verify best tide level is shown', async () => {
      await expect(page.getByRole('heading', { name: 'Best Tide Level' })).toBeVisible();
      await expect(page.getByText('Tide Level', { exact: true })).toBeVisible();
    });
  });
});

test.describe('Dashboard - Browse Locations Tab', () => {

  test.beforeEach(async ({ page }) => {
    await openTab(page, 'Browse Locations');
    await expect(page.getByRole('heading', { name: /Browse Fishing Locations/ })).toBeVisible();
  });

  test('should render locations list', async ({ page }) => {
    await test.step('1. Click on "Browse Locations" tab', async () => {
      // Already done in beforeEach
    });

    await test.step('2. Verify locations list/grid is visible', async () => {
      await expect(page.getByRole('button', { name: /Grand Baie/ })).toBeVisible();
    });
  });

  test('should display location names', async ({ page }) => {
    await test.step('1. Verify common Mauritius location names are listed', async () => {
      for (const name of ['Grand Baie', 'Cap Malheureux', 'Belle Mare']) {
        await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
      }
    });
  });

  test('should have search/filter functionality', async ({ page }) => {
    await test.step('1. Search for "Grand Baie"', async () => {
      await page.getByLabel('Search locations').fill('Grand Baie');
    });

    await test.step('2. Verify only matching locations remain', async () => {
      await expect(page.getByRole('heading', { name: 'Grand Baie', exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Belle Mare', exact: true })).toHaveCount(0);
    });
  });
});

test.describe('Dashboard - Best Conditions Tab', () => {

  test.beforeEach(async ({ page }) => {
    await openTab(page, 'Best Conditions');
    await expect(page.getByRole('heading', { name: /Best Conditions Analyzer/ })).toBeVisible();
  });

  test('should render best conditions section', async ({ page }) => {
    await test.step('1. Click on "Best Conditions" tab', async () => {
      // Already done in beforeEach
    });

    await test.step('2. Verify the filters are shown', async () => {
      await expect(page.getByRole('heading', { name: 'Filters' })).toBeVisible();
      await expect(page.getByPlaceholder('Enter bait name...')).toBeVisible();
    });
  });

  test('should display optimal fishing conditions', async ({ page, apiHelper }) => {
    let seeded;

    await test.step('1. Log a successful Casting trip', async () => {
      seeded = await seedSuccessfulLog(apiHelper, { fishingTypes: ['Casting'] });
    });

    try {
      await test.step('2. Filter by "Casting"', async () => {
        const analysis = page.waitForResponse(r => r.url().includes('/api/fishing/best-conditions') && r.url().includes('fishingType=Casting'));
        await page.locator('select').filter({ has: page.locator('option', { hasText: 'All Types' }) }).selectOption('Casting');
        expect((await analysis).ok()).toBeTruthy();
      });

      await test.step('3. Verify the analysis and best conditions are shown', async () => {
        await expect(page.getByRole('heading', { name: /Analysis for: Casting/ })).toBeVisible();
        await expect(page.getByText(/^Based on \d+ successful fishing trips/)).toBeVisible();
        for (const heading of ['Best Moon Phase', 'Best Tide', 'Best Location', 'Best Month']) {
          await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
        }
      });
    } finally {
      await apiHelper.deleteFishingLog(seeded.token, seeded.id);
    }
  });
});
