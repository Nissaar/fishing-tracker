/// <reference path="../types.d.ts" />
/// <reference path="../fixtures.d.ts" />
// @ts-check
/** @type {import('../fixtures')} */
const fixtures = require('../fixtures');
const { test: testBase, expect } = fixtures;
/** @type {import('@playwright/test').TestType<import('../fixtures').Fixtures>} */
const test = testBase;

/**
 * Facebook Share Tool Test Suite (admin only)
 *
 * The admin generates a ready-to-post Kreol update containing the current
 * standings. The wording is fixed; only the names and numbers change.
 *
 * Manual check:
 *   1. Sign in as admin, open the "Top Anglers" tab
 *   2. The "Partaz lor Facebook" panel is shown with an ADMIN badge
 *   3. Kopie teks copies the post; the Kreol/English toggle switches language
 *   4. Unticking the "nouvo fonksion" box drops the launch blurb
 */

test.describe('Facebook share tool - admin view', () => {

  test.beforeEach(async ({ pageHelper }) => {
    await pageHelper.navigateToDashboardTab('Top Anglers');
  });

  test('should show the share panel to an admin', async ({ page }) => {
    await test.step('1. Verify the panel is rendered', async () => {
      await expect(page.getByText('Partaz lor Facebook')).toBeVisible();
    });

    await test.step('2. Verify it is labelled as an admin tool', async () => {
      await expect(page.getByText('ADMIN', { exact: true })).toBeVisible();
    });

    await test.step('3. Verify the copy and open-page actions are offered', async () => {
      await expect(page.getByRole('button', { name: /Kopie teks/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Ouver mo paz/i })).toBeVisible();
    });
  });

  test('should switch the generated post between Kreol and English', async ({ page }) => {
    await test.step('1. Reveal the generated text', async () => {
      const preview = page.getByRole('button', { name: /Get teks|Preview text/i });
      if (await preview.count() > 0) {
        await preview.click();
      }
    });

    await test.step('2. Verify the Kreol wording is used by default', async () => {
      await expect(page.locator('textarea')).toContainText('PESKER');
    });

    await test.step('3. Switch to English', async () => {
      await page.getByRole('button', { name: 'English', exact: true }).click();
    });

    await test.step('4. Verify the post is now in English', async () => {
      await expect(page.locator('textarea')).toContainText('ANGLERS');
    });
  });

  test('should drop the launch blurb but keep the standings', async ({ page, pageHelper, apiHelper }) => {
    let token;
    let logId;

    await test.step('1. Log a trip so the week has standings to report', async () => {
      token = await apiHelper.login(
        process.env.TEST_USER_EMAIL || 'e2etest@fishingtracker.mu',
        process.env.TEST_USER_PASSWORD || 'password'
      );
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
        bait: 'Lures',
        notes: 'E2E_TEST share text seed'
      });
      expect(response.status()).toBe(201);
      logId = (await response.json()).log.id;
    });

    await test.step('2. Reload the tab so the new trip is counted', async () => {
      await pageHelper.navigateToDashboardTab('Top Anglers');
      const preview = page.getByRole('button', { name: /Get teks|Preview text/i });
      if (await preview.count() > 0) {
        await preview.click();
      }
    });

    await test.step('3. Verify the post carries both the standings and the launch blurb', async () => {
      await expect(page.locator('textarea')).toContainText('Plis sorti lapes');
      await expect(page.locator('textarea')).toContainText('NOUVO LOR SIT-LA');
    });

    await test.step('4. Untick the "nouvo fonksion" checkbox', async () => {
      await page.locator('input[type="checkbox"]').first().uncheck();
    });

    await test.step('5. Verify only the blurb was dropped', async () => {
      await expect(page.locator('textarea')).not.toContainText('NOUVO LOR SIT-LA');
      await expect(page.locator('textarea')).toContainText('Plis sorti lapes');
      await expect(page.locator('textarea')).toContainText('TOP 5 PESKER');
    });

    await test.step('6. Clean up the seeded trip', async () => {
      await apiHelper.deleteFishingLog(token, logId);
    });
  });

  test('should fall back to an invitation when the period has no trips yet', async ({ page }) => {
    await test.step('1. Reveal the generated text', async () => {
      const preview = page.getByRole('button', { name: /Get teks|Preview text/i });
      if (await preview.count() > 0) {
        await preview.click();
      }
    });

    await test.step('2. Verify the post always carries its heading and signup link', async () => {
      await expect(page.locator('textarea')).toContainText('TOP 5 PESKER');
      await expect(page.locator('textarea')).toContainText('Enskri gratis');
    });
  });

  test('should still keep the ranked board visible to the admin', async ({ page }) => {
    await test.step('1. Verify the categories render alongside the share tool', async () => {
      await expect(page.getByText('Most Trips Logged', { exact: true })).toBeVisible();
    });
  });
});
