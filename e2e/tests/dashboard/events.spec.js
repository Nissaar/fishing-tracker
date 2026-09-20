/// <reference path="../types.d.ts" />
/// <reference path="../fixtures.d.ts" />
// @ts-check
/** @type {import('../fixtures')} */
const fixtures = require('../fixtures');
const { test: testBase, expect } = fixtures;
/** @type {import('@playwright/test').TestType<import('../fixtures').Fixtures>} */
const test = testBase;

/**
 * Fishing Events Test Suite (members)
 *
 * Members announce where and when they are going fishing; other members join.
 *
 * Manual check:
 *   1. Sign in, open the Events tab
 *   2. Create event → it appears under "All upcoming"
 *   3. Sign in as another user → Join → the counter goes up
 *   4. An organiser cannot leave their own event, only delete it
 */

const futureDate = (daysAhead) => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split('T')[0];
};

/** Registers a throwaway member and returns their bearer token. */
const registerMember = async (request, apiUrl, testData) => {
  const user = testData.randomUser();
  const response = await request.post(`${apiUrl}/auth/register`, { data: user });
  expect(response.ok()).toBeTruthy();
  return (await response.json()).token;
};

test.describe('Events API - lifecycle', () => {

  let token;

  test.beforeEach(async ({ apiHelper }) => {
    token = await apiHelper.login(
      process.env.TEST_USER_EMAIL || 'e2etest@fishingtracker.mu',
      process.env.TEST_USER_PASSWORD || 'password'
    );
  });

  test('should create an event and list the organiser as the first participant', async ({ apiHelper, request }) => {
    let created;

    await test.step('1. Create an event three days from now', async () => {
      const response = await request.post(`${apiHelper.url}/events`, {
        headers: apiHelper.getAuthHeaders(token),
        data: {
          title: 'E2E_TEST morning casting',
          description: 'E2E test event',
          eventDate: futureDate(3),
          timeStart: '06:00',
          timeEnd: '10:00',
          location: 'grand-baie',
          fishingTypes: ['Casting', 'Jigging'],
          fishingMethod: 'land'
        }
      });
      expect(response.status()).toBe(201);
      created = (await response.json()).event;
    });

    await test.step('2. Verify the organiser is auto-joined', async () => {
      expect(created.participantCount).toBe(1);
      expect(created.hasJoined).toBeTruthy();
      expect(created.isOrganiser).toBeTruthy();
    });

    await test.step('3. Verify the date comes back as plain YYYY-MM-DD', async () => {
      expect(created.eventDate).toBe(futureDate(3));
    });

    await test.step('4. Verify both fishing types were stored', async () => {
      expect(created.fishingTypes).toEqual(['Casting', 'Jigging']);
    });

    await test.step('5. Clean up', async () => {
      await request.delete(`${apiHelper.url}/events/${created.id}`, {
        headers: apiHelper.getAuthHeaders(token)
      });
    });
  });

  test('should reject an event dated in the past', async ({ apiHelper, request }) => {
    let response;

    await test.step('1. Attempt to create an event dated in 2020', async () => {
      response = await request.post(`${apiHelper.url}/events`, {
        headers: apiHelper.getAuthHeaders(token),
        data: { title: 'E2E_TEST past event', eventDate: '2020-01-01', location: 'grand-baie' }
      });
    });

    await test.step('2. Verify it is refused with an explanation', async () => {
      expect(response.status()).toBe(400);
      expect((await response.json()).error).toContain('past');
    });
  });

  test('should reject an unknown location', async ({ apiHelper, request }) => {
    let response;

    await test.step('1. Attempt to create an event at a location that does not exist', async () => {
      response = await request.post(`${apiHelper.url}/events`, {
        headers: apiHelper.getAuthHeaders(token),
        data: { title: 'E2E_TEST nowhere', eventDate: futureDate(2), location: 'atlantis' }
      });
    });

    await test.step('2. Verify it is refused', async () => {
      expect(response.status()).toBe(400);
      expect((await response.json()).error).toContain('location');
    });
  });

  test('should let another member join and then leave', async ({ apiHelper, request, testData }) => {
    let eventId;
    let joinerToken;

    await test.step('1. Organiser creates an event', async () => {
      const response = await request.post(`${apiHelper.url}/events`, {
        headers: apiHelper.getAuthHeaders(token),
        data: { title: 'E2E_TEST joinable', eventDate: futureDate(4), location: 'blue-bay' }
      });
      eventId = (await response.json()).event.id;
    });

    await test.step('2. A second member signs up', async () => {
      joinerToken = await registerMember(request, apiHelper.url, testData);
    });

    await test.step('3. The second member joins the trip', async () => {
      const response = await request.post(`${apiHelper.url}/events/${eventId}/join`, {
        headers: apiHelper.getAuthHeaders(joinerToken),
        data: {}
      });
      expect(response.ok()).toBeTruthy();
    });

    await test.step('4. Verify the participant count reflects both anglers', async () => {
      const response = await request.get(`${apiHelper.url}/events/${eventId}`, {
        headers: apiHelper.getAuthHeaders(token)
      });
      expect((await response.json()).event.participantCount).toBe(2);
    });

    await test.step('5. The second member leaves again', async () => {
      const response = await request.delete(`${apiHelper.url}/events/${eventId}/join`, {
        headers: apiHelper.getAuthHeaders(joinerToken)
      });
      expect(response.ok()).toBeTruthy();
    });

    await test.step('6. Verify the count drops back to the organiser alone', async () => {
      const response = await request.get(`${apiHelper.url}/events/${eventId}`, {
        headers: apiHelper.getAuthHeaders(token)
      });
      expect((await response.json()).event.participantCount).toBe(1);
    });

    await test.step('7. Clean up', async () => {
      await request.delete(`${apiHelper.url}/events/${eventId}`, {
        headers: apiHelper.getAuthHeaders(token)
      });
    });
  });

  test('should refuse a join once the event is full', async ({ apiHelper, request, testData }) => {
    let eventId;

    await test.step('1. Create an event capped at one angler (the organiser)', async () => {
      const response = await request.post(`${apiHelper.url}/events`, {
        headers: apiHelper.getAuthHeaders(token),
        data: {
          title: 'E2E_TEST full event',
          eventDate: futureDate(5),
          location: 'belle-mare',
          maxParticipants: 1
        }
      });
      eventId = (await response.json()).event.id;
    });

    await test.step('2. Another member tries to join', async () => {
      const joinerToken = await registerMember(request, apiHelper.url, testData);
      const response = await request.post(`${apiHelper.url}/events/${eventId}/join`, {
        headers: apiHelper.getAuthHeaders(joinerToken),
        data: {}
      });

      await test.step('3. Verify the join is refused as full', async () => {
        expect(response.status()).toBe(400);
        expect((await response.json()).error).toContain('full');
      });
    });

    await test.step('4. Clean up', async () => {
      await request.delete(`${apiHelper.url}/events/${eventId}`, {
        headers: apiHelper.getAuthHeaders(token)
      });
    });
  });

  test('should stop the organiser leaving their own event', async ({ apiHelper, request }) => {
    let eventId;

    await test.step('1. Create an event', async () => {
      const response = await request.post(`${apiHelper.url}/events`, {
        headers: apiHelper.getAuthHeaders(token),
        data: { title: 'E2E_TEST organiser leave', eventDate: futureDate(6), location: 'mahebourg' }
      });
      eventId = (await response.json()).event.id;
    });

    await test.step('2. The organiser attempts to leave', async () => {
      const response = await request.delete(`${apiHelper.url}/events/${eventId}/join`, {
        headers: apiHelper.getAuthHeaders(token)
      });

      await test.step('3. Verify they are told to delete it instead', async () => {
        expect(response.status()).toBe(400);
        expect((await response.json()).error).toContain('organiser');
      });
    });

    await test.step('4. Clean up', async () => {
      await request.delete(`${apiHelper.url}/events/${eventId}`, {
        headers: apiHelper.getAuthHeaders(token)
      });
    });
  });

  test('should stop a non-organiser deleting someone else\'s event', async ({ apiHelper, request, testData }) => {
    let eventId;

    await test.step('1. Create an event as the organiser', async () => {
      const response = await request.post(`${apiHelper.url}/events`, {
        headers: apiHelper.getAuthHeaders(token),
        data: { title: 'E2E_TEST ownership', eventDate: futureDate(7), location: 'pereybere' }
      });
      eventId = (await response.json()).event.id;
    });

    await test.step('2. A different member tries to delete it', async () => {
      const otherToken = await registerMember(request, apiHelper.url, testData);
      const response = await request.delete(`${apiHelper.url}/events/${eventId}`, {
        headers: apiHelper.getAuthHeaders(otherToken)
      });

      await test.step('3. Verify the deletion is refused', async () => {
        expect(response.status()).toBe(404);
      });
    });

    await test.step('4. Clean up as the real organiser', async () => {
      const response = await request.delete(`${apiHelper.url}/events/${eventId}`, {
        headers: apiHelper.getAuthHeaders(token)
      });
      expect(response.ok()).toBeTruthy();
    });
  });
});

test.describe('Events UI - dashboard tab', () => {

  test('should open the Events tab and reveal the create form', async ({ page, pageHelper }) => {
    await test.step('1. Open the Events tab', async () => {
      await pageHelper.navigateToDashboardTab('Events');
    });

    await test.step('2. Verify the section explains what events are for', async () => {
      await expect(page.getByRole('heading', { name: /Fishing Events/i })).toBeVisible();
    });

    await test.step('3. Open the create form', async () => {
      await page.getByRole('button', { name: /Create event/i }).click();
    });

    await test.step('4. Verify the form fields are present', async () => {
      await expect(page.getByRole('button', { name: /Publish event/i })).toBeVisible();
      await expect(page.locator('input[type="date"]')).toBeVisible();
    });
  });

  test('should offer the upcoming, mine and past filters', async ({ page, pageHelper }) => {
    await test.step('1. Open the Events tab', async () => {
      await pageHelper.navigateToDashboardTab('Events');
    });

    await test.step('2. Verify all three scope filters are available', async () => {
      await expect(page.getByRole('button', { name: 'All upcoming', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Mine', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Past', exact: true })).toBeVisible();
    });
  });
});
