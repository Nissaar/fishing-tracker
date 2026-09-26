// @ts-check
const { test, expect } = require('../fixtures');
const path = require('path');

// Storage state paths
const USER_AUTH = path.join(__dirname, '../../playwright/.auth/user.json');
const ADMIN_AUTH = path.join(__dirname, '../../playwright/.auth/admin.json');

const USER_EMAIL = process.env.TEST_USER_EMAIL || 'e2etest@fishingtracker.mu';
const USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'password';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@fishingtracker.mu';

/**
 * Admin Panel Test Suite
 * Comprehensive tests for all admin functionality including:
 * - Overview/Statistics Dashboard
 * - Custom Submissions Review & Approval
 * - Contact Messages Management
 * - Dropdown Management (Baits, Fish Species, etc)
 * - User Management & Admin Status
 * - System Logs Viewing
 *
 * Manual Testing Guide:
 * Admin Credentials:
 * - Email: admin@fishingtracker.mu
 * - Password: password
 *
 * Only admin users can access /admin routes
 * Non-admin users are redirected to dashboard
 *
 * Detailed steps: See TEST_DOCUMENTATION.md
 */

const ADMIN_TABS = ['Overview', 'Review Submissions', 'System Logs', 'Contact Messages', 'Manage Dropdowns', 'User Management'];

/** Open /admin and wait until the page has finished its initial load. */
const openAdmin = async (page) => {
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
};

/** Click one of the admin tabs and wait until it reports itself as active. */
const openTab = async (page, name) => {
  const tab = page.getByRole('button', { name, exact: true });
  await tab.click();
  await expect(tab).toHaveAttribute('aria-pressed', 'true');
};

/** The value shown under a stat card label on the Overview tab. */
const statValue = (page, label) =>
  page.getByText(label, { exact: true }).locator('xpath=following-sibling::p[1]');

/**
 * The backend allows 100 /api/admin requests per 15 minutes per IP, and
 * every visit to /admin costs two (stats + users) plus five more for the
 * dropdown lists. Loading the page fresh for every test ran the suite into
 * that limit, so each tab's tests share one page, opened once.
 *
 * @param {string | null} tabName tab to open after the page loads
 * @param {(page: import('@playwright/test').Page) => Promise<void>} [afterOpen]
 */
const useSharedAdminPage = (tabName, afterOpen) => {
  test.describe.configure({ mode: 'serial' });
  const shared = /** @type {{ page: import('@playwright/test').Page }} */ ({});

  test.beforeAll(async ({ browser }) => {
    shared.page = await browser.newPage({ storageState: ADMIN_AUTH });
    await openAdmin(shared.page);
    if (tabName) await openTab(shared.page, tabName);
    if (afterOpen) await afterOpen(shared.page);
  });

  test.afterAll(async () => {
    await shared.page?.close();
  });

  return shared;
};

/**
 * The newest success toast with this text. Toasts from earlier tests on the
 * shared page can still be on screen, hence `.last()`.
 */
const successToast = (page, text) =>
  page.locator('.Toastify__toast--success').filter({ hasText: text }).last();

const uniqueSuffix = () => `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

test.describe('Admin - Access Control', () => {

  // This test needs to run as a non-admin user
  test('should redirect non-admin users to dashboard', async ({ browser }) => {
    const context = await browser.newContext({ storageState: USER_AUTH });
    const page = await context.newPage();

    try {
      await test.step('1. Navigate to /admin as non-admin user', async () => {
        await page.goto('/admin');
      });

      await test.step('2. Verify redirect to /dashboard', async () => {
        await expect(page).toHaveURL(/\/dashboard$/);
        await expect(page.getByRole('button', { name: /Log Trip/ })).toBeVisible();
      });

      await test.step('3. Verify the admin page and Admin link are not shown', async () => {
        await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toHaveCount(0);
        await expect(page.getByRole('link', { name: 'Admin' })).toHaveCount(0);
      });
    } finally {
      await context.close();
    }
  });

  test('should show admin tabs for admin users', async ({ page }) => {
    await test.step('1. Navigate to /admin as admin user', async () => {
      await page.goto('/admin');
    });

    await test.step('2. Verify admin stays on /admin and sees the dashboard', async () => {
      await expect(page).toHaveURL(/\/admin$/);
      await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
    });

    await test.step('3. Verify all admin tabs are visible', async () => {
      for (const name of ADMIN_TABS) {
        await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
      }
    });
  });

  test('should reach the admin page from the header Admin link', async ({ page }) => {
    await test.step('1. Open the dashboard as admin', async () => {
      await page.goto('/dashboard');
    });

    await test.step('2. Click the Admin link in the header', async () => {
      await page.getByRole('link', { name: 'Admin' }).click();
    });

    await test.step('3. Verify the admin dashboard opens', async () => {
      await expect(page).toHaveURL(/\/admin$/);
      await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
    });
  });
});

test.describe('Admin - Overview Tab', () => {

  const shared = useSharedAdminPage(null);

  test('should display statistics dashboard', async () => {
    const page = shared.page;
    await test.step('1. Verify "Overview" is the default tab', async () => {
      await expect(page.getByRole('button', { name: 'Overview', exact: true })).toHaveAttribute('aria-pressed', 'true');
    });

    await test.step('2. Verify the statistic cards are visible', async () => {
      for (const label of ['Total Users', 'Total Logs', 'Success Rate', 'Active Users', 'This Month']) {
        await expect(page.getByText(label, { exact: true })).toBeVisible();
      }
    });
  });

  test('should show total users count', async () => {
    const page = shared.page;
    await test.step('1. Verify total users is a positive number (at least the two test accounts)', async () => {
      await expect(statValue(page, 'Total Users')).toHaveText(/^\d+$/);
      const count = Number(await statValue(page, 'Total Users').textContent());
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });

  test('should show total fishing logs count', async () => {
    const page = shared.page;
    await test.step('1. Verify total logs is a number', async () => {
      await expect(statValue(page, 'Total Logs')).toHaveText(/^\d+$/);
    });
  });

  test('should display most active users', async () => {
    const page = shared.page;
    const panel = page.locator('div.bg-white', { has: page.getByRole('heading', { name: 'Most Active Users' }) });

    await test.step('1. Verify the "Most Active Users" section is visible', async () => {
      await expect(page.getByRole('heading', { name: 'Most Active Users' })).toBeVisible();
    });

    await test.step('2. Verify it lists users with their trip counts', async () => {
      await expect(panel.getByText('trips').first()).toBeVisible();
    });
  });

  test('should display popular locations', async () => {
    const page = shared.page;
    await test.step('1. Verify the "Popular Locations" section is visible', async () => {
      await expect(page.getByRole('heading', { name: 'Popular Locations' })).toBeVisible();
    });
  });

  test('should display success rate', async () => {
    const page = shared.page;
    await test.step('1. Verify success rate is shown as a percentage', async () => {
      await expect(statValue(page, 'Success Rate')).toHaveText(/^\d+(\.\d+)?%$/);
    });
  });
});

test.describe('Admin - Review Submissions Tab', () => {

  const shared = useSharedAdminPage(null);

  /** Submit a custom bait as the regular test user so there is something to review. */
  const createSubmission = async (apiHelper, request) => {
    const token = await apiHelper.login(USER_EMAIL, USER_PASSWORD);
    const value = `E2E_TEST_Bait_${uniqueSuffix()}`;
    const response = await request.post(`${apiHelper.url}/fishing/custom-submission`, {
      headers: apiHelper.getAuthHeaders(token),
      data: { dropdownType: 'bait', value, description: 'Created by the admin e2e suite' }
    });
    expect(response.status()).toBe(201);
    return value;
  };

  /** The card for one submission, found by its submitted value. */
  const submissionCard = (page, value) =>
    page.locator('div.border.rounded-lg', { has: page.getByRole('heading', { name: value, exact: true }) });

  /** Show the tab and reload the list so it includes anything just created. */
  const openSubmissions = async (page) => {
    await openTab(page, 'Review Submissions');
    const loaded = page.waitForResponse(r => r.url().includes('/api/admin/submissions') && r.ok());
    await page.getByRole('button', { name: 'Refresh' }).click();
    await loaded;
  };

  test('should display submissions list', async () => {
    const page = shared.page;
    await test.step('1. Click "Review Submissions" tab', async () => {
      await openSubmissions(page);
    });

    await test.step('2. Verify the submissions section is shown', async () => {
      await expect(page.getByRole('heading', { name: 'Custom Dropdown Submissions' })).toBeVisible();
      await expect(page.getByText('Review user-submitted custom values for dropdowns')).toBeVisible();
    });
  });

  test('should have filter options for submissions', async () => {
    const page = shared.page;
    await test.step('1. Click "Review Submissions" tab', async () => {
      await openSubmissions(page);
    });

    await test.step('2. Verify the Pending and All filters are available', async () => {
      await expect(page.getByRole('button', { name: /^Pending \(\d+\)$/ })).toBeVisible();
      await expect(page.getByRole('button', { name: 'All Submissions' })).toBeVisible();
    });
  });

  test('should display submission details', async ({ apiHelper, request }) => {
    const page = shared.page;
    let value;

    await test.step('1. Create a custom bait submission as the test user', async () => {
      value = await createSubmission(apiHelper, request);
    });

    await test.step('2. Click "Review Submissions" tab', async () => {
      await openSubmissions(page);
    });

    await test.step('3. Verify the submission shows its type, status and submitter', async () => {
      const card = submissionCard(page, value);
      await expect(card).toBeVisible();
      await expect(card.getByText('bait', { exact: true })).toBeVisible();
      await expect(card.getByText('pending', { exact: true })).toBeVisible();
      await expect(card.getByText(/Submitted by:/)).toContainText('E2E Test User');
    });
  });

  test('should have approve button for pending submissions', async ({ apiHelper, request }) => {
    const page = shared.page;
    let value;

    await test.step('1. Create a custom bait submission as the test user', async () => {
      value = await createSubmission(apiHelper, request);
    });

    await test.step('2. Click "Review Submissions" tab', async () => {
      await openSubmissions(page);
    });

    await test.step('3. Approve the submission', async () => {
      await submissionCard(page, value).getByRole('button', { name: 'Approve' }).click();
    });

    await test.step('4. Verify it is marked approved and can no longer be reviewed', async () => {
      await expect(successToast(page, 'Submission approved')).toBeVisible();
      const card = submissionCard(page, value);
      await expect(card.getByText('approved', { exact: true })).toBeVisible();
      await expect(card.getByRole('button', { name: 'Approve' })).toHaveCount(0);
      await expect(card.getByText(/Reviewed by:/)).toBeVisible();
    });
  });

  test('should have reject button for pending submissions', async ({ apiHelper, request }) => {
    const page = shared.page;
    let value;

    await test.step('1. Create a custom bait submission as the test user', async () => {
      value = await createSubmission(apiHelper, request);
    });

    await test.step('2. Click "Review Submissions" tab', async () => {
      await openSubmissions(page);
    });

    await test.step('3. Reject the submission', async () => {
      await submissionCard(page, value).getByRole('button', { name: 'Reject' }).click();
    });

    await test.step('4. Verify it is marked rejected and can no longer be reviewed', async () => {
      await expect(successToast(page, 'Submission rejected')).toBeVisible();
      const card = submissionCard(page, value);
      await expect(card.getByText('rejected', { exact: true })).toBeVisible();
      await expect(card.getByRole('button', { name: 'Reject' })).toHaveCount(0);
    });
  });

  // Species typed into a trip log have no submission row until reviewed, and
  // an id like fl_fish_<logId>_<n>; approving one used to fail with a 500
  test('should approve a new species typed into a trip log', async ({ apiHelper, request }) => {
    const page = shared.page;
    const species = `E2E_TEST_Fish_${uniqueSuffix()}`;
    let token;
    let logId;

    await test.step('1. Log a trip with a species that is not in the list yet', async () => {
      token = await apiHelper.login(USER_EMAIL, USER_PASSWORD);
      const response = await request.post(`${apiHelper.url}/fishing/logs`, {
        headers: apiHelper.getAuthHeaders(token),
        data: {
          date: new Date().toISOString().split('T')[0],
          timeStart: '06:00',
          timeEnd: '09:00',
          location: 'grand-baie',
          caughtFish: true,
          fishCount: 1,
          fishTypes: [species],
          fishingTypes: ['Casting'],
          notes: 'E2E_TEST log-derived species'
        }
      });
      expect(response.status()).toBe(201);
      logId = (await response.json()).log.id;
    });

    await test.step('2. Approve it from "Review Submissions"', async () => {
      await openSubmissions(page);
      const card = submissionCard(page, species);
      await expect(card.getByText('fish species', { exact: true })).toBeVisible();
      await card.getByRole('button', { name: 'Approve' }).click();
      await expect(successToast(page, 'Submission approved')).toBeVisible();
      await expect(card.getByText('approved', { exact: true })).toBeVisible();
    });

    await test.step('3. Verify the species is now offered when logging a trip', async () => {
      const response = await request.get(`${apiHelper.url}/fishing/dropdown/fish-species`, {
        headers: apiHelper.getAuthHeaders(token)
      });
      const names = (await response.json()).map(s => s.local_name);
      expect(names).toContain(species);
    });

    await test.step('4. Clean up the trip', async () => {
      await request.delete(`${apiHelper.url}/fishing/logs/${logId}`, { headers: apiHelper.getAuthHeaders(token) });
    });
  });

  test('should show submission count', async ({ apiHelper, request }) => {
    const page = shared.page;
    const pendingButton = page.getByRole('button', { name: /^Pending \(\d+\)$/ });
    const pendingCount = async () => Number((await pendingButton.textContent())?.match(/\d+/)?.[0]);
    let before;

    await test.step('1. Read the pending count', async () => {
      await openSubmissions(page);
      before = await pendingCount();
    });

    await test.step('2. Create a new submission and refresh the list', async () => {
      await createSubmission(apiHelper, request);
      const reloaded = page.waitForResponse(r => r.url().includes('/api/admin/submissions') && r.ok());
      await page.getByRole('button', { name: 'Refresh' }).click();
      await reloaded;
    });

    await test.step('3. Verify the pending count went up by one', async () => {
      await expect.poll(pendingCount).toBe(before + 1);
    });
  });
});

test.describe('Admin - Contact Messages Tab', () => {

  const shared = useSharedAdminPage(null);

  /** Send a contact message through the public endpoint so there is one to act on. */
  const createMessage = async (apiHelper, testData) => {
    const message = { ...testData.contactMessage(), subject: `E2E_TEST_Subject_${uniqueSuffix()}` };
    const response = await apiHelper.submitContact(message);
    expect(response.ok()).toBeTruthy();
    return message;
  };

  const messageRow = (page, subject) => page.getByRole('row', { name: new RegExp(subject) });

  /** Show the tab with the "all" filter and reload it so it includes anything just sent. */
  const openContact = async (page) => {
    await openTab(page, 'Contact Messages');
    await page.getByRole('button', { name: /^all$/i }).click();
    await expect(page.getByRole('button', { name: /^all$/i })).toHaveAttribute('aria-pressed', 'true');
    const loaded = page.waitForResponse(r => r.url().includes('/api/contact/all') && r.ok());
    await page.getByRole('button', { name: 'Refresh' }).click();
    await loaded;
  };

  test('should display contact messages list', async ({ apiHelper, testData }) => {
    const page = shared.page;
    let message;

    await test.step('1. Send a contact message', async () => {
      message = await createMessage(apiHelper, testData);
    });

    await test.step('2. Open the Contact Messages tab', async () => {
      await openContact(page);
    });

    await test.step('3. Verify the table and the new message are shown', async () => {
      for (const header of ['From', 'Subject', 'Status', 'Date', 'Actions']) {
        await expect(page.getByRole('columnheader', { name: header })).toBeVisible();
      }
      await expect(messageRow(page, message.subject)).toContainText(message.name);
    });
  });

  test('should have read/unread filter', async ({ apiHelper, testData }) => {
    const page = shared.page;
    let message;

    await test.step('1. Send a contact message (it starts unread)', async () => {
      message = await createMessage(apiHelper, testData);
    });

    await test.step('2. Open the Contact Messages tab', async () => {
      await openContact(page);
    });

    await test.step('3. Verify the status filters are available', async () => {
      for (const status of ['all', 'unread', 'read', 'replied']) {
        await expect(page.getByRole('button', { name: new RegExp(`^${status}$`, 'i') })).toBeVisible();
      }
    });

    await test.step('4. Filter by "read" and verify the unread message disappears', async () => {
      const filtered = page.waitForResponse(r => r.url().includes('/api/contact/all') && r.url().includes('status=read'));
      await page.getByRole('button', { name: /^read$/i }).click();
      await filtered;
      await expect(page.getByRole('button', { name: /^read$/i })).toHaveAttribute('aria-pressed', 'true');
      await expect(messageRow(page, message.subject)).toHaveCount(0);
    });

    await test.step('5. Filter by "unread" and verify the message is listed', async () => {
      await page.getByRole('button', { name: /^unread$/i }).click();
      await expect(messageRow(page, message.subject)).toBeVisible();
    });
  });

  test('should show message details on click', async ({ apiHelper, testData }) => {
    const page = shared.page;
    let message;

    await test.step('1. Send a contact message', async () => {
      message = await createMessage(apiHelper, testData);
    });

    await test.step('2. Open the Contact Messages tab and click View on the message', async () => {
      await openContact(page);
      await messageRow(page, message.subject).getByRole('button', { name: 'View' }).click();
    });

    await test.step('3. Verify a dialog shows the sender, email and message', async () => {
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('heading', { name: message.name })).toBeVisible();
      await expect(dialog).toContainText(message.email.toLowerCase());
      await expect(dialog).toContainText(message.message);
    });

    await test.step('4. Close the dialog', async () => {
      // The header X is also labelled "Close"; use the text button in the footer
      await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).filter({ hasText: 'Close' }).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
    });
  });

  test('should show unread count', async ({ apiHelper, testData }) => {
    const page = shared.page;
    const unreadLabel = page.getByText(/^\d+ Unread$/);

    await test.step('1. Send a contact message', async () => {
      await createMessage(apiHelper, testData);
    });

    await test.step('2. Open the Contact Messages tab', async () => {
      await openContact(page);
    });

    await test.step('3. Verify the unread count is shown and at least one', async () => {
      await expect(unreadLabel).toBeVisible();
      await expect(page.getByText(/^\d+ Total$/)).toBeVisible();
      const unread = Number((await unreadLabel.textContent())?.match(/\d+/)?.[0]);
      expect(unread).toBeGreaterThanOrEqual(1);
    });
  });

  test('should have mark as read functionality', async ({ apiHelper, testData }) => {
    const page = shared.page;
    let message;

    await test.step('1. Send a contact message', async () => {
      message = await createMessage(apiHelper, testData);
    });

    await test.step('2. Open it from the Contact Messages tab', async () => {
      await openContact(page);
      await expect(messageRow(page, message.subject).getByText('unread', { exact: true })).toBeVisible();
      await messageRow(page, message.subject).getByRole('button', { name: 'View' }).click();
    });

    await test.step('3. Click "Mark Read"', async () => {
      await page.getByRole('dialog').getByRole('button', { name: 'Mark Read' }).click();
    });

    await test.step('4. Verify the message is now marked read', async () => {
      await expect(successToast(page, 'Message status updated')).toBeVisible();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(messageRow(page, message.subject).getByText('read', { exact: true })).toBeVisible();
    });
  });

  test('should have delete message functionality', async ({ apiHelper, testData }) => {
    const page = shared.page;
    let message;

    await test.step('1. Send a contact message', async () => {
      message = await createMessage(apiHelper, testData);
    });

    await test.step('2. Open it from the Contact Messages tab', async () => {
      await openContact(page);
      await messageRow(page, message.subject).getByRole('button', { name: 'View' }).click();
    });

    await test.step('3. Click "Delete" and confirm', async () => {
      page.once('dialog', dialog => dialog.accept());
      await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    });

    await test.step('4. Verify the message is removed from the list', async () => {
      await expect(successToast(page, 'Message deleted')).toBeVisible();
      await expect(messageRow(page, message.subject)).toHaveCount(0);
    });
  });
});

test.describe('Admin - Manage Dropdowns Tab', () => {

  const SUB_TABS = [/Fishing Baits/, /Fishing Types/, /Fishing Methods/, /Fish Species/, /Locations/];

  const itemsHeading = (page) => page.getByRole('heading', { name: /^Items \(\d+\)$/ });
  const itemCount = async (page) => Number((await itemsHeading(page).textContent())?.match(/\d+/)?.[0]);

  /** Row for one dropdown item, found by its title. */
  const itemRow = (page, name) =>
    page.locator('div.justify-between.bg-gray-50', { has: page.getByRole('heading', { name, exact: true }) });

  const showBaits = async (page) => {
    await page.getByRole('button', { name: /Fishing Baits/ }).click();
    await expect(page.getByRole('button', { name: /Fishing Baits/ })).toHaveAttribute('aria-pressed', 'true');
  };

  /** Add a bait through the form and wait until it shows in the list. */
  const addBait = async (page, name) => {
    await page.getByPlaceholder('Name *').fill(name);
    await page.getByRole('button', { name: 'Add Item' }).click();
    await expect(successToast(page, 'Item added')).toBeVisible();
    await expect(itemRow(page, name)).toBeVisible();
  };

  const shared = useSharedAdminPage('Manage Dropdowns');

  test('should display dropdown management section', async () => {
    const page = shared.page;
    await test.step('1. Verify the add form and item list are shown', async () => {
      await expect(page.getByRole('heading', { name: 'Add New Item' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Add Item' })).toBeVisible();
      await expect(itemsHeading(page)).toBeVisible();
    });
  });

  test('should have tabs for different dropdown types', async () => {
    const page = shared.page;
    await test.step('1. Verify every dropdown list has a tab', async () => {
      for (const name of SUB_TABS) {
        await expect(page.getByRole('button', { name })).toBeVisible();
      }
    });

    await test.step('2. Verify "Fishing Baits" is selected by default', async () => {
      await expect(page.getByRole('button', { name: /Fishing Baits/ })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test('should display baits management', async () => {
    const page = shared.page;
    await showBaits(page);

    await test.step('1. Verify the seeded baits are listed', async () => {
      await expect.poll(() => itemCount(page)).toBeGreaterThan(0);
    });

    await test.step('2. Verify every bait has edit and delete controls', async () => {
      await expect(page.getByRole('button', { name: /^Edit / }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /^Delete / }).first()).toBeVisible();
    });
  });

  test('should allow adding new bait', async () => {
    const page = shared.page;
    const name = `E2E_TEST_Bait_${uniqueSuffix()}`;
    let before;

    await showBaits(page);

    await test.step('1. Read the current number of baits', async () => {
      await expect.poll(() => itemCount(page)).toBeGreaterThan(0);
      before = await itemCount(page);
    });

    await test.step(`2. Add a bait named ${name}`, async () => {
      await addBait(page, name);
    });

    await test.step('3. Verify the list grew by one', async () => {
      await expect.poll(() => itemCount(page)).toBe(before + 1);
    });
  });

  test('should display fish species with local/english/scientific names', async () => {
    const page = shared.page;
    await test.step('1. Open the "Fish Species" list', async () => {
      await page.getByRole('button', { name: /Fish Species/ }).click();
      await expect(page.getByRole('button', { name: /Fish Species/ })).toHaveAttribute('aria-pressed', 'true');
    });

    await test.step('2. Verify the add form asks for all three names', async () => {
      await expect(page.getByPlaceholder('Local Name *')).toBeVisible();
      await expect(page.getByPlaceholder('English Name')).toBeVisible();
      await expect(page.getByPlaceholder('Scientific Name')).toBeVisible();
    });

    await test.step('3. Verify seeded species are listed', async () => {
      await expect.poll(() => itemCount(page)).toBeGreaterThan(0);
    });
  });

  test('should link baits to fishing types', async () => {
    const page = shared.page;
    await showBaits(page);

    await test.step('1. Verify the bait form has a fishing type selector', async () => {
      const typeSelect = page.getByLabel('Fishing type');
      await expect(typeSelect).toBeVisible();
      await expect.poll(() => typeSelect.locator('option').count()).toBeGreaterThan(1);
    });

    await test.step('2. Verify listed baits show the fishing type they belong to', async () => {
      await expect(page.getByText(/^Type: /).first()).toBeVisible();
    });
  });

  test('should allow editing existing dropdown items', async () => {
    const page = shared.page;
    const name = `E2E_TEST_Bait_${uniqueSuffix()}`;
    const renamed = `${name}_edited`;

    await showBaits(page);

    await test.step('1. Add a bait to edit', async () => {
      await addBait(page, name);
    });

    await test.step('2. Open the edit dialog and rename it', async () => {
      await page.getByRole('button', { name: `Edit ${name}`, exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Edit Item' });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByLabel('Name', { exact: true })).toHaveValue(name);
      await dialog.getByLabel('Name', { exact: true }).fill(renamed);
      await dialog.getByRole('button', { name: 'Save' }).click();
    });

    await test.step('3. Verify the list shows the new name', async () => {
      await expect(successToast(page, 'Item updated')).toBeVisible();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(itemRow(page, renamed)).toBeVisible();
      await expect(itemRow(page, name)).toHaveCount(0);
    });
  });

  test('should allow deleting dropdown items', async () => {
    const page = shared.page;
    const name = `E2E_TEST_Bait_${uniqueSuffix()}`;

    await showBaits(page);

    await test.step('1. Add a bait to delete', async () => {
      await addBait(page, name);
    });

    await test.step('2. Delete it and confirm', async () => {
      page.once('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: `Delete ${name}`, exact: true }).click();
    });

    await test.step('3. Verify it is removed from the list', async () => {
      await expect(successToast(page, 'Item deleted')).toBeVisible();
      await expect(itemRow(page, name)).toHaveCount(0);
    });
  });
});

test.describe('Admin - User Management Tab', () => {

  const userRow = (page, email) => page.getByRole('row', { name: new RegExp(email.replace(/[.]/g, '\\.')) });

  const shared = useSharedAdminPage('User Management');

  test('should display users list', async () => {
    const page = shared.page;
    await test.step('1. Verify the users table lists both test accounts', async () => {
      await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();
      await expect(userRow(page, USER_EMAIL)).toBeVisible();
      await expect(userRow(page, ADMIN_EMAIL)).toBeVisible();
    });
  });

  test('should display user details - username, email', async () => {
    const page = shared.page;
    await test.step('1. Verify the column headers', async () => {
      for (const header of ['Username', 'Email', 'Logs', 'Admin', 'Actions']) {
        await expect(page.getByRole('columnheader', { name: header, exact: true })).toBeVisible();
      }
    });

    await test.step('2. Verify the test user row shows username and email', async () => {
      const row = userRow(page, USER_EMAIL);
      await expect(row.getByRole('cell').nth(0)).toHaveText('E2E Test User');
      await expect(row.getByRole('cell').nth(1)).toHaveText(USER_EMAIL);
    });
  });

  test('should have search functionality', async () => {
    const page = shared.page;
    await test.step('1. Search for the test user email', async () => {
      await page.getByLabel('Search users').fill(USER_EMAIL);
    });

    await test.step('2. Verify only matching users remain', async () => {
      await expect(userRow(page, USER_EMAIL)).toBeVisible();
      await expect(userRow(page, ADMIN_EMAIL)).toHaveCount(0);
    });

    await test.step('3. Search for something that matches nobody', async () => {
      await page.getByLabel('Search users').fill(`nobody_${uniqueSuffix()}`);
      await expect(page.locator('table').last().locator('tbody tr')).toHaveCount(0);
    });

    await test.step('4. Clear the search and verify everyone is listed again', async () => {
      await page.getByLabel('Search users').fill('');
      await expect(userRow(page, ADMIN_EMAIL)).toBeVisible();
    });
  });

  test('should allow viewing user entries', async ({ apiHelper }) => {
    const page = shared.page;
    let token;
    let logId;

    await test.step('1. Log a trip as the test user', async () => {
      token = await apiHelper.login(USER_EMAIL, USER_PASSWORD);
      const response = await apiHelper.createFishingLog(token, {
        date: new Date().toISOString().split('T')[0],
        timeStart: '06:00',
        timeEnd: '08:00',
        location: 'grand-baie',
        caughtFish: false,
        fishCount: 0,
        fishTypes: [],
        fishingTypes: ['Casting'],
        fishingMethod: 'land',
        notes: 'E2E_TEST admin entries view'
      });
      expect(response.status()).toBe(201);
      logId = (await response.json()).log.id;
    });

    try {
      await test.step('2. Click "Logs" for the test user', async () => {
        const loaded = page.waitForResponse(r => r.url().includes('/api/admin/user-entries/') && r.ok());
        await userRow(page, USER_EMAIL).getByRole('button', { name: 'Logs' }).click();
        await loaded;
      });

      await test.step('3. Verify their entries are listed under "View User Entries"', async () => {
        await expect(page.getByLabel('Select User')).toHaveValue('E2E Test User');
        await expect(page.getByRole('heading', { name: /^Entries \(\d+\)$/ })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Grand Baie' }).first()).toBeVisible();
      });
    } finally {
      await apiHelper.deleteFishingLog(token, logId);
    }
  });

  test('should allow editing user', async () => {
    const page = shared.page;
    const row = userRow(page, USER_EMAIL);

    await test.step('1. Click "Edit" on the test user', async () => {
      await row.getByRole('button', { name: 'Edit' }).click();
    });

    await test.step('2. Verify the row turns into an edit form', async () => {
      const table = page.locator('table').last();
      await expect(table.getByLabel('Username')).toHaveValue('E2E Test User');
      await expect(table.getByLabel('Email')).toHaveValue(USER_EMAIL);
      await expect(table.getByRole('button', { name: 'Save' })).toBeVisible();
    });

    await test.step('3. Cancel and verify the row is unchanged', async () => {
      await page.locator('table').last().getByRole('button', { name: 'Cancel' }).click();
      await expect(page.locator('table').last().getByLabel('Username')).toHaveCount(0);
      await expect(row.getByRole('cell').nth(0)).toHaveText('E2E Test User');
    });
  });

  test('should show admin status for users', async () => {
    const page = shared.page;
    await test.step('1. Verify the admin account is flagged as admin', async () => {
      await expect(userRow(page, ADMIN_EMAIL).getByRole('cell').nth(3)).toHaveText('Yes');
      await expect(userRow(page, ADMIN_EMAIL).getByRole('button', { name: 'Remove Admin' })).toBeVisible();
    });

    await test.step('2. Verify the regular test user is not', async () => {
      await expect(userRow(page, USER_EMAIL).getByRole('cell').nth(3)).toHaveText('No');
      await expect(userRow(page, USER_EMAIL).getByRole('button', { name: 'Make Admin' })).toBeVisible();
    });
  });
});

test.describe('Admin - System Logs Tab', () => {

  const logContent = (page) => page.locator('pre');

  const shared = useSharedAdminPage(null, async (page) => {
    const filesLoaded = page.waitForResponse(r => r.url().includes('/api/logs/files') && r.ok());
    await openTab(page, 'System Logs');
    await filesLoaded;
  });

  test('should display system logs', async () => {
    const page = shared.page;
    await test.step('1. Verify the log file list and content panes are shown', async () => {
      await expect(page.getByRole('heading', { name: 'System Logs' })).toBeVisible();
      await expect(page.getByText('Log Files', { exact: true })).toBeVisible();
    });

    await test.step('2. Verify a log file is selected and its content loaded', async () => {
      await expect(page.locator('button[aria-pressed="true"]', { hasText: /\.log$/ })).toBeVisible();
      await expect(logContent(page)).toBeVisible();
      await expect(logContent(page)).not.toHaveText('No content');
    });
  });

  // The System Logs tab only has a free-text search; there is no level filter
  test.fixme('should have log level filter', async () => {
    const page = shared.page;
    const logsTab = page.locator('button:has-text("System Logs")');

    if (await logsTab.isVisible()) {
      await logsTab.click();

      // Filter by level
      const levelFilter = page.locator('button:has-text("All"), button:has-text("Error"), button:has-text("Info"), select');
      // Level filter should be available
    }
  });

  test('should filter log lines with the search box', async () => {
    const page = shared.page;
    await test.step('1. Wait for the selected log file to load', async () => {
      await expect(logContent(page)).not.toHaveText('No content');
    });

    await test.step('2. Search for text that matches nothing', async () => {
      await page.getByLabel('Search logs').fill(`no_such_line_${uniqueSuffix()}`);
    });

    await test.step('3. Verify no lines are shown', async () => {
      await expect(logContent(page)).toHaveText('No content');
    });

    await test.step('4. Clear the search and verify the lines come back', async () => {
      await page.getByLabel('Search logs').fill('');
      await expect(logContent(page)).not.toHaveText('No content');
    });
  });

  test('should display log timestamp', async () => {
    const page = shared.page;
    await test.step('1. Verify log lines start with a date', async () => {
      await expect(logContent(page)).toContainText(/\d{4}-\d{2}-\d{2}/);
    });
  });

  test('should have refresh functionality', async () => {
    const page = shared.page;
    await test.step('1. Click "Refresh"', async () => {
      const reloaded = page.waitForResponse(r => r.url().includes('/api/logs/files') && r.ok());
      await page.getByRole('button', { name: 'Refresh' }).click();
      await reloaded;
    });

    await test.step('2. Verify the logs are still shown', async () => {
      await expect(logContent(page)).toContainText(/\d{4}-\d{2}-\d{2}/);
    });
  });
});
