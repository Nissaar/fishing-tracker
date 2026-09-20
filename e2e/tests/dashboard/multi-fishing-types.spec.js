/// <reference path="../types.d.ts" />
/// <reference path="../fixtures.d.ts" />
// @ts-check
/** @type {import('../fixtures')} */
const fixtures = require('../fixtures');
const { test: testBase, expect } = fixtures;
/** @type {import('@playwright/test').TestType<import('../fixtures').Fixtures>} */
const test = testBase;

/**
 * Multiple Fishing Types Test Suite
 *
 * One trip can combine several techniques. The full list is stored in
 * fishing_types; the legacy fishing_type column keeps the first one so older
 * reports and filters keep working.
 *
 * Manual check:
 *   1. Sign in, open Log Trip
 *   2. "Types of Fishing" is a row of chips, not a dropdown
 *   3. Select two, save, then check View Data shows both
 */

test.describe('Multiple fishing types - storage', () => {

  let token;

  test.beforeEach(async ({ apiHelper }) => {
    token = await apiHelper.login(
      process.env.TEST_USER_EMAIL || 'e2etest@fishingtracker.mu',
      process.env.TEST_USER_PASSWORD || 'password'
    );
  });

  test('should store every selected type and keep the first for compatibility', async ({ apiHelper, request }) => {
    let logId;

    await test.step('1. Log a trip that combined casting and jigging', async () => {
      const response = await apiHelper.createFishingLog(token, {
        date: new Date().toISOString().split('T')[0],
        timeStart: '06:00',
        timeEnd: '10:00',
        location: 'grand-baie',
        caughtFish: true,
        fishCount: 3,
        fishTypes: ['Carangue'],
        fishingTypes: ['Casting', 'Jigging'],
        fishingMethod: 'land',
        bait: 'Lures',
        notes: 'E2E_TEST multi type trip'
      });
      expect(response.status()).toBe(201);
      logId = (await response.json()).log.id;
    });

    await test.step('2. Read the trip back', async () => {
      const response = await request.get(`${apiHelper.url}/fishing/logs/${logId}`, {
        headers: apiHelper.getAuthHeaders(token)
      });
      const { log } = await response.json();

      await test.step('3. Verify both types were kept', async () => {
        expect(log.fishing_types).toEqual(['Casting', 'Jigging']);
      });

      await test.step('4. Verify the legacy column holds the first type', async () => {
        expect(log.fishing_type).toBe('Casting');
      });
    });

    await test.step('5. Clean up', async () => {
      await apiHelper.deleteFishingLog(token, logId);
    });
  });

  test('should keep working for a trip that used a single type', async ({ apiHelper, request }) => {
    let logId;

    await test.step('1. Log a single-type trip', async () => {
      const response = await apiHelper.createFishingLog(token, {
        date: new Date().toISOString().split('T')[0],
        timeStart: '07:00',
        timeEnd: '09:00',
        location: 'blue-bay',
        caughtFish: false,
        fishCount: 0,
        fishTypes: [],
        fishingTypes: ['Trolling'],
        fishingMethod: 'boat',
        notes: 'E2E_TEST single type trip'
      });
      expect(response.status()).toBe(201);
      logId = (await response.json()).log.id;
    });

    await test.step('2. Verify it round-trips as a one-element list', async () => {
      const response = await request.get(`${apiHelper.url}/fishing/logs/${logId}`, {
        headers: apiHelper.getAuthHeaders(token)
      });
      const { log } = await response.json();
      expect(log.fishing_types).toEqual(['Trolling']);
      expect(log.fishing_type).toBe('Trolling');
    });

    await test.step('3. Clean up', async () => {
      await apiHelper.deleteFishingLog(token, logId);
    });
  });

  test('should match a trip by any of its types when filtering', async ({ apiHelper, request }) => {
    let logId;

    await test.step('1. Log a trip whose second type is Bottom Fishing', async () => {
      const response = await apiHelper.createFishingLog(token, {
        date: new Date().toISOString().split('T')[0],
        timeStart: '05:00',
        timeEnd: '11:00',
        location: 'mahebourg',
        caughtFish: true,
        fishCount: 4,
        fishTypes: ['Bonite'],
        fishingTypes: ['Casting', 'Bottom Fishing'],
        fishingMethod: 'boat',
        notes: 'E2E_TEST secondary type filter'
      });
      logId = (await response.json()).log.id;
    });

    await test.step('2. Filter best conditions by the secondary type', async () => {
      const response = await request.get(
        `${apiHelper.url}/fishing/best-conditions?fishingType=Bottom%20Fishing`,
        { headers: apiHelper.getAuthHeaders(token) }
      );
      expect(response.ok()).toBeTruthy();

      await test.step('3. Verify the trip is found even though it is not the primary type', async () => {
        const body = await response.json();
        expect(body.conditions).not.toBeNull();
        expect(body.conditions.dataPoints).toBeGreaterThan(0);
      });
    });

    await test.step('4. Clean up', async () => {
      await apiHelper.deleteFishingLog(token, logId);
    });
  });
});

test.describe('Multiple fishing types - Log Trip form', () => {

  test('should present fishing types as multi-select chips', async ({ page, pageHelper }) => {
    await test.step('1. Open the Log Trip tab', async () => {
      await pageHelper.navigateToDashboardTab('Log Trip');
    });

    await test.step('2. Verify the field invites more than one choice', async () => {
      await expect(page.getByText(/Types of Fishing/i)).toBeVisible();
      await expect(page.getByText(/select all you used/i)).toBeVisible();
    });
  });

  test('should allow two types to be selected at once', async ({ page, pageHelper }) => {
    await test.step('1. Open the Log Trip tab', async () => {
      await pageHelper.navigateToDashboardTab('Log Trip');
    });

    let chips;
    await test.step('2. Find the fishing type chips', async () => {
      chips = page.locator('button[aria-pressed]');
      expect(await chips.count()).toBeGreaterThan(1);
    });

    await test.step('3. Select the first two chips', async () => {
      await chips.nth(0).click();
      await chips.nth(1).click();
    });

    await test.step('4. Verify both report themselves as selected', async () => {
      await expect(chips.nth(0)).toHaveAttribute('aria-pressed', 'true');
      await expect(chips.nth(1)).toHaveAttribute('aria-pressed', 'true');
    });

    await test.step('5. Verify the form confirms the count', async () => {
      await expect(page.getByText(/2 types selected/i)).toBeVisible();
    });
  });
});
