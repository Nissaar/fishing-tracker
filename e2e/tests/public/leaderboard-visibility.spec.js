/// <reference path="../types.d.ts" />
/// <reference path="../fixtures.d.ts" />
// @ts-check
/** @type {import('../fixtures')} */
const fixtures = require('../fixtures');
const { test: testBase, expect } = fixtures;
/** @type {import('@playwright/test').TestType<import('../fixtures').Fixtures>} */
const test = testBase;

/**
 * Leaderboard Visibility Test Suite (signed-out visitors)
 *
 * The ranked standings and the admin Facebook tool are members-only. This
 * suite guards that boundary from both sides: the API must not hand the names
 * out without a session, and the landing page must not render them.
 *
 * Manual check:
 *   1. Open the site in a private window (do not sign in)
 *   2. Scroll to "Top 5 Contributors"
 *   3. You should see only a count of anglers and a signup button
 *   4. No usernames, no category cards, no "Kopie teks" button
 */

test.describe('Leaderboard API - signed-out access', () => {

  test('should no longer expose the ranked leaderboard publicly', async ({ apiHelper, request }) => {
    let response;

    await test.step('1. Request the retired public leaderboard endpoint', async () => {
      response = await request.get(`${apiHelper.url}/public/leaderboard?period=week`);
    });

    await test.step('2. Verify it is gone (404), not serving rankings', async () => {
      expect(response.status()).toBe(404);
    });
  });

  test('should return counts only from the public summary, with no usernames', async ({ apiHelper, request }) => {
    let response;
    let body;

    await test.step('1. Request the public leaderboard summary without a token', async () => {
      response = await request.get(`${apiHelper.url}/public/leaderboard/summary?period=week`);
    });

    await test.step('2. Verify it succeeds', async () => {
      expect(response.ok()).toBeTruthy();
      body = await response.json();
    });

    await test.step('3. Verify it carries participant and trip counts', async () => {
      expect(typeof body.participants).toBe('number');
      expect(typeof body.totals.trips).toBe('number');
      expect(typeof body.totals.fish).toBe('number');
    });

    await test.step('4. Verify it exposes no rankings and no usernames', async () => {
      expect(body.categories).toBeUndefined();
      const raw = JSON.stringify(body).toLowerCase();
      expect(raw).not.toContain('username');
      expect(raw).not.toContain('e2e test user');
      expect(raw).not.toContain('admin user');
    });
  });

  test('should require a session for the ranked leaderboard', async ({ apiHelper, request }) => {
    let response;

    await test.step('1. Request the ranked leaderboard with no Authorization header', async () => {
      response = await request.get(`${apiHelper.url}/fishing/leaderboard?period=week`);
    });

    await test.step('2. Verify access is refused', async () => {
      expect(response.status()).toBe(401);
    });
  });

  test('should return ranked names once a valid token is supplied', async ({ apiHelper, request }) => {
    let body;

    await test.step('1. Sign in as the test user to obtain a token', async () => {
      const token = await apiHelper.login(
        process.env.TEST_USER_EMAIL || 'e2etest@fishingtracker.mu',
        process.env.TEST_USER_PASSWORD || 'password'
      );
      const response = await request.get(`${apiHelper.url}/fishing/leaderboard?period=week`, {
        headers: apiHelper.getAuthHeaders(token)
      });
      expect(response.ok()).toBeTruthy();
      body = await response.json();
    });

    await test.step('2. Verify all four ranking categories are present', async () => {
      expect(body.categories.trips).toBeDefined();
      expect(body.categories.fish).toBeDefined();
      expect(body.categories.fishingTypes).toBeDefined();
      expect(body.categories.baits).toBeDefined();
    });

    await test.step('3. Verify the period window is returned as plain YYYY-MM-DD', async () => {
      expect(body.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(body.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});

test.describe('Leaderboard UI - signed-out landing page', () => {

  test.beforeEach(async ({ page, pageHelper }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await pageHelper.waitForLoadingComplete();
  });

  test('should show the signup teaser instead of the standings', async ({ page }) => {
    await test.step('1. Locate the Top 5 Contributors section', async () => {
      await expect(page.getByRole('heading', { name: /Top 5 Contributors/i })).toBeVisible();
    });

    await test.step('2. Verify the signup call to action is offered', async () => {
      await expect(page.getByRole('link', { name: /Sign up free to see the Top 5/i })).toBeVisible();
    });
  });

  test('should not render any ranking category cards', async ({ page }) => {
    await test.step('1. Verify none of the four category headings appear', async () => {
      for (const heading of ['Most Trips Logged', 'Most Fish Caught', 'Most Fishing Types', 'Most Baits Used']) {
        await expect(page.getByText(heading, { exact: false })).toHaveCount(0);
      }
    });
  });

  test('should not render the admin Facebook share tool', async ({ page }) => {
    await test.step('1. Verify the share panel is absent', async () => {
      await expect(page.getByText('Partaz lor Facebook')).toHaveCount(0);
    });

    await test.step('2. Verify the copy-text button is absent', async () => {
      await expect(page.getByRole('button', { name: /Kopie teks/i })).toHaveCount(0);
    });
  });

  test('should not leak any member username into the page', async ({ page }) => {
    await test.step('1. Read the rendered page text', async () => {
      const body = (await page.locator('body').innerText()).toLowerCase();
      expect(body).not.toContain('e2e test user');
      expect(body).not.toContain('admin user');
    });
  });
});
