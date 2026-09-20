/// <reference path="../types.d.ts" />
/// <reference path="../fixtures.d.ts" />
// @ts-check
/** @type {import('../fixtures')} */
const fixtures = require('../fixtures');
const { test: testBase, expect } = fixtures;
/** @type {import('@playwright/test').TestType<import('../fixtures').Fixtures>} */
const test = testBase;

/**
 * Events Teaser Test Suite (signed-out visitors)
 *
 * Visitors are shown that trips are being organised, but not where exactly,
 * by whom, or with a way to join. That requires an account.
 *
 * Manual check:
 *   1. Open the site in a private window
 *   2. Scroll to "Who's Going Fishing?"
 *   3. You should see date, region and fishing types only
 *   4. No exact spot, no organiser name, no Join button
 */

test.describe('Events API - signed-out access', () => {

  test('should require a session to list events', async ({ apiHelper, request }) => {
    let response;

    await test.step('1. Request the events list with no token', async () => {
      response = await request.get(`${apiHelper.url}/events`);
    });

    await test.step('2. Verify access is refused', async () => {
      expect(response.status()).toBe(401);
    });
  });

  test('should require a session to create an event', async ({ apiHelper, request }) => {
    let response;

    await test.step('1. Attempt to create an event with no token', async () => {
      response = await request.post(`${apiHelper.url}/events`, {
        data: { title: 'E2E_TEST unauthorised event', eventDate: '2099-01-01', location: 'grand-baie' }
      });
    });

    await test.step('2. Verify access is refused', async () => {
      expect(response.status()).toBe(401);
    });
  });

  test('should expose only coarse details in the public teaser', async ({ apiHelper, request }) => {
    let body;

    await test.step('1. Request the public upcoming-events teaser', async () => {
      const response = await request.get(`${apiHelper.url}/public/events/upcoming`);
      expect(response.ok()).toBeTruthy();
      body = await response.json();
    });

    await test.step('2. Verify it reports how many trips are coming up', async () => {
      expect(typeof body.upcomingTotal).toBe('number');
      expect(Array.isArray(body.events)).toBeTruthy();
    });

    await test.step('3. Verify no event carries the exact spot, organiser or title', async () => {
      for (const event of body.events) {
        expect(event.locationName).toBeUndefined();
        expect(event.location).toBeUndefined();
        expect(event.organiser).toBeUndefined();
        expect(event.title).toBeUndefined();
        expect(event.description).toBeUndefined();
      }
    });

    await test.step('4. Verify the coarse fields that are shown are present', async () => {
      for (const event of body.events) {
        expect(event.region).toBeDefined();
        expect(event.eventDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(Array.isArray(event.fishingTypes)).toBeTruthy();
      }
    });
  });
});

test.describe('Events UI - signed-out landing page', () => {

  test('should advertise the events section without offering a way to join', async ({ page, pageHelper }) => {
    await test.step('1. Open the landing page signed out', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await pageHelper.waitForLoadingComplete();
    });

    await test.step('2. Verify the events section is present', async () => {
      await expect(page.getByRole('heading', { name: /Who's Going Fishing/i })).toBeVisible();
    });

    await test.step('3. Verify no Join buttons are offered to visitors', async () => {
      await expect(page.getByRole('button', { name: /Join this trip/i })).toHaveCount(0);
    });
  });
});
