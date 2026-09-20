/// <reference path="../types.d.ts" />
/// <reference path="../fixtures.d.ts" />
// @ts-check
/** @type {import('../fixtures')} */
const fixtures = require('../fixtures');
const { test: testBase, expect } = fixtures;
/** @type {import('@playwright/test').TestType<import('../fixtures').Fixtures>} */
const test = testBase;

/**
 * Leaderboard Test Suite (ordinary members)
 *
 * Members see the full standings. They must not see the Facebook copy-text
 * tool, which is the site owner's marketing tool.
 *
 * Manual check:
 *   1. Sign in as a normal (non-admin) user
 *   2. Open the "Top Anglers" tab
 *   3. Four category cards and a This week / This month toggle are shown
 *   4. There is no "Partaz lor Facebook" panel
 */

test.describe('Leaderboard UI - member view', () => {

  test.beforeEach(async ({ pageHelper }) => {
    await pageHelper.navigateToDashboardTab('Top Anglers');
  });

  test('should show all four ranking categories', async ({ page }) => {
    await test.step('1. Verify the heading is present', async () => {
      await expect(page.getByRole('heading', { name: /Top Contributors/i })).toBeVisible();
    });

    await test.step('2. Verify each category card is rendered', async () => {
      for (const heading of ['Most Trips Logged', 'Most Fish Caught', 'Most Fishing Types', 'Most Baits Used']) {
        await expect(page.getByText(heading, { exact: true })).toBeVisible();
      }
    });
  });

  test('should offer the weekly and monthly views', async ({ page }) => {
    await test.step('1. Verify both period buttons are present', async () => {
      await expect(page.getByRole('button', { name: /This week/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /This month/i })).toBeVisible();
    });

    await test.step('2. Switch to the monthly view', async () => {
      await page.getByRole('button', { name: /This month/i }).click();
    });

    await test.step('3. Verify the categories are still rendered after switching', async () => {
      await expect(page.getByText('Most Trips Logged', { exact: true })).toBeVisible();
    });
  });

  test('should NOT show the admin Facebook share tool', async ({ page }) => {
    await test.step('1. Verify the share panel is absent for an ordinary member', async () => {
      await expect(page.getByText('Partaz lor Facebook')).toHaveCount(0);
    });

    await test.step('2. Verify the copy-text button is absent', async () => {
      await expect(page.getByRole('button', { name: /Kopie teks/i })).toHaveCount(0);
    });
  });
});
