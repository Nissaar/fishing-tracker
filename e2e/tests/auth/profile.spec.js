// @ts-check
const { randomUUID } = require('crypto');
const { test, expect } = require('../fixtures');

/**
 * Profile Test Suite
 * Users changing their own username, email and password.
 * Every test registers its own user so the shared test accounts never change.
 * Usernames keep the E2E_TEST_ prefix so cleanup.js removes them.
 */

const STRONG_PASSWORD = 'Str0ng!Pass';
const NEW_PASSWORD = 'N3wer!Pass';

const uniq = () => randomUUID().slice(0, 8);

/** @param {import('@playwright/test').APIRequestContext} request */
async function registerUser(request, apiUrl) {
  const id = uniq();
  const user = { username: `E2E_TEST_prof_${id}`, email: `e2e_prof_${id}@example.com`, password: STRONG_PASSWORD };
  const response = await request.post(`${apiUrl}/auth/register`, { data: user });
  expect(response.status()).toBe(201);
  return { ...user, token: (await response.json()).token };
}

test.describe('Profile - API', () => {

  test('should change the username', async ({ request, apiHelper }) => {
    const user = await registerUser(request, apiHelper.url);
    const username = `E2E_TEST_renamed_${uniq()}`;

    const response = await request.put(`${apiHelper.url}/auth/profile`, {
      headers: apiHelper.getAuthHeaders(user.token),
      data: { username }
    });
    expect(response.status()).toBe(200);
    expect((await response.json()).user.username).toBe(username);

    const profile = await request.get(`${apiHelper.url}/auth/profile`, { headers: apiHelper.getAuthHeaders(user.token) });
    const body = await profile.json();
    expect(body.user.username).toBe(username);
    expect(body.user.token_version).toBeUndefined();
  });

  test('should refuse a username another account has, ignoring case', async ({ request, apiHelper }) => {
    const first = await registerUser(request, apiHelper.url);
    const second = await registerUser(request, apiHelper.url);

    const response = await request.put(`${apiHelper.url}/auth/profile`, {
      headers: apiHelper.getAuthHeaders(second.token),
      data: { username: first.username.toUpperCase() }
    });
    expect(response.status()).toBe(409);
  });

  test('should require the current password to change the email', async ({ request, apiHelper }) => {
    const user = await registerUser(request, apiHelper.url);
    const email = `e2e_moved_${uniq()}@example.com`;

    const wrong = await request.put(`${apiHelper.url}/auth/profile`, {
      headers: apiHelper.getAuthHeaders(user.token),
      data: { email, currentPassword: 'not-it' }
    });
    // 400, not 401: a 401 would make the app log the user out
    expect(wrong.status()).toBe(400);

    const right = await request.put(`${apiHelper.url}/auth/profile`, {
      headers: apiHelper.getAuthHeaders(user.token),
      data: { email, currentPassword: user.password }
    });
    expect(right.status()).toBe(200);

    const login = await request.post(`${apiHelper.url}/auth/login`, { data: { email, password: user.password } });
    expect(login.status()).toBe(200);
  });

  test('should refuse an email another account has', async ({ request, apiHelper }) => {
    const first = await registerUser(request, apiHelper.url);
    const second = await registerUser(request, apiHelper.url);

    const response = await request.put(`${apiHelper.url}/auth/profile`, {
      headers: apiHelper.getAuthHeaders(second.token),
      data: { email: first.email.toUpperCase(), currentPassword: second.password }
    });
    expect(response.status()).toBe(409);
  });

  test('should change the password and sign out other sessions', async ({ request, apiHelper }) => {
    const user = await registerUser(request, apiHelper.url);
    const otherSession = await apiHelper.login(user.email, user.password);

    const weak = await request.put(`${apiHelper.url}/auth/password`, {
      headers: apiHelper.getAuthHeaders(user.token),
      data: { currentPassword: user.password, newPassword: 'short' }
    });
    expect(weak.status()).toBe(400);

    const wrong = await request.put(`${apiHelper.url}/auth/password`, {
      headers: apiHelper.getAuthHeaders(user.token),
      data: { currentPassword: 'not-it', newPassword: NEW_PASSWORD }
    });
    expect(wrong.status()).toBe(400);

    const response = await request.put(`${apiHelper.url}/auth/password`, {
      headers: apiHelper.getAuthHeaders(user.token),
      data: { currentPassword: user.password, newPassword: NEW_PASSWORD }
    });
    expect(response.status()).toBe(200);
    const { token } = await response.json();

    const withNewToken = await request.get(`${apiHelper.url}/auth/profile`, { headers: apiHelper.getAuthHeaders(token) });
    expect(withNewToken.status()).toBe(200);

    for (const oldToken of [user.token, otherSession]) {
      const revoked = await request.get(`${apiHelper.url}/auth/profile`, { headers: apiHelper.getAuthHeaders(oldToken) });
      expect(revoked.status()).toBe(401);
    }

    const oldLogin = await request.post(`${apiHelper.url}/auth/login`, { data: { email: user.email, password: user.password } });
    expect(oldLogin.status()).toBe(401);
    const newLogin = await request.post(`${apiHelper.url}/auth/login`, { data: { email: user.email, password: NEW_PASSWORD } });
    expect(newLogin.status()).toBe(200);
  });
});

test.describe('Profile - UI', () => {

  test('should edit the username and password from the profile page', async ({ page, request, apiHelper, pageHelper }) => {
    const user = await registerUser(request, apiHelper.url);
    const username = `E2E_TEST_ui_${uniq()}`;

    await test.step('1. Log in and open the profile from the header', async () => {
      await pageHelper.login(user.email, user.password);
      await page.getByRole('link', { name: 'Profile' }).click();
      await expect(page).toHaveURL(/\/profile/);
    });

    await test.step('2. Change the username', async () => {
      await page.fill('#profile-username', username);
      await page.getByRole('button', { name: 'Save changes' }).click();
      await pageHelper.waitForToast('Profile updated');
      await expect(page.locator('header')).toContainText(username);
    });

    await test.step('3. Change the password and stay logged in', async () => {
      await page.fill('#profile-current-password', user.password);
      await page.fill('#profile-new-password', NEW_PASSWORD);
      await page.fill('#profile-confirm-password', NEW_PASSWORD);
      await page.getByRole('button', { name: 'Change password' }).click();
      // The "Profile updated" toast from the previous step may still be showing
      await expect(page.locator('.Toastify__toast--success', { hasText: 'Password changed' })).toBeVisible();
      await page.reload();
      await expect(page).toHaveURL(/\/profile/);
      await expect(page.locator('#profile-username')).toHaveValue(username);
    });
  });
});
