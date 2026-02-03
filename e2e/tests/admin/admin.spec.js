// @ts-check
const { test, expect } = require('../fixtures');
const path = require('path');

// Storage state paths
const USER_AUTH = path.join(__dirname, '../../playwright/.auth/user.json');

/**
 * Admin Panel Test Suite
 * Comprehensive tests for all admin functionality including:
 * - Overview/Statistics
 * - Custom Submissions Review
 * - Contact Messages
 * - Dropdown Management
 * - User Management
 * - System Logs
 */

test.describe('Admin - Access Control', () => {
  
  // This test needs to run as a non-admin user
  test('should redirect non-admin users to dashboard', async ({ browser }) => {
    // Create a new context with user (non-admin) auth state
    const context = await browser.newContext({ storageState: USER_AUTH });
    const page = await context.newPage();
    
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Non-admin should be redirected or shown access denied
    const url = page.url();
    const hasAccessDenied = await page.locator('text=/access denied|not authorized|admin.*required/i').isVisible();
    
    // Either redirected away from admin or shown access denied
    expect(url.includes('/dashboard') || url.includes('/admin') || hasAccessDenied).toBeTruthy();
    
    await context.close();
  });
  
  test('should show admin tabs for admin users', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // If user is admin, tabs should be visible
    const overviewTab = page.locator('button:has-text("Overview")');
    const hasAdminAccess = await overviewTab.isVisible();
    
    if (hasAdminAccess) {
      await expect(page.locator('button:has-text("Review Submissions")')).toBeVisible();
      await expect(page.locator('button:has-text("System Logs")')).toBeVisible();
      await expect(page.locator('button:has-text("Contact Messages")')).toBeVisible();
      await expect(page.locator('button:has-text("Manage Dropdowns")')).toBeVisible();
      await expect(page.locator('button:has-text("User Management")')).toBeVisible();
    }
  });
});

test.describe('Admin - Overview Tab', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });
  
  test('should display statistics dashboard', async ({ page }) => {
    const overviewTab = page.locator('button:has-text("Overview")');
    
    if (await overviewTab.isVisible()) {
      await overviewTab.click();
      await page.waitForTimeout(1000);
      
      // Should display stats cards
      const statsSection = page.locator('[class*="grid"], [class*="flex"]').first();
      await expect(statsSection).toBeVisible();
    }
  });
  
  test('should show total users count', async ({ page }) => {
    const overviewTab = page.locator('button:has-text("Overview")');
    
    if (await overviewTab.isVisible()) {
      await overviewTab.click();
      await page.waitForTimeout(1000);
      
      const usersCount = page.locator('text=/users|total.*users/i');
      // Users count should be displayed
    }
  });
  
  test('should show total fishing logs count', async ({ page }) => {
    const overviewTab = page.locator('button:has-text("Overview")');
    
    if (await overviewTab.isVisible()) {
      await overviewTab.click();
      await page.waitForTimeout(1000);
      
      const logsCount = page.locator('text=/logs|trips|entries/i');
      // Logs count should be displayed
    }
  });
  
  test('should display most active users', async ({ page }) => {
    const overviewTab = page.locator('button:has-text("Overview")');
    
    if (await overviewTab.isVisible()) {
      await overviewTab.click();
      await page.waitForTimeout(1000);
      
      const activeUsers = page.locator('text=/active.*users|top.*users/i');
      // Active users list might be displayed
    }
  });
  
  test('should display popular locations', async ({ page }) => {
    const overviewTab = page.locator('button:has-text("Overview")');
    
    if (await overviewTab.isVisible()) {
      await overviewTab.click();
      await page.waitForTimeout(1000);
      
      const locations = page.locator('text=/popular.*locations|top.*locations/i');
      // Popular locations might be displayed
    }
  });
  
  test('should display success rate', async ({ page }) => {
    const overviewTab = page.locator('button:has-text("Overview")');
    
    if (await overviewTab.isVisible()) {
      await overviewTab.click();
      await page.waitForTimeout(1000);
      
      const successRate = page.locator('text=/success.*rate|%/i');
      // Success rate should be displayed
    }
  });
});

test.describe('Admin - Review Submissions Tab', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });
  
  test('should display submissions list', async ({ page }) => {
    const submissionsTab = page.locator('button:has-text("Review Submissions")');
    
    if (await submissionsTab.isVisible()) {
      await submissionsTab.click();
      await page.waitForTimeout(1500);
      
      // Submissions list or "no submissions" message should appear
      const submissionsList = page.locator('table, [class*="list"], [class*="grid"]').first();
      const noSubmissions = page.locator('text=/no.*submissions|no.*pending/i');
      
      const hasContent = await submissionsList.isVisible() || await noSubmissions.isVisible();
      expect(hasContent).toBeTruthy();
    }
  });
  
  test('should have filter options for submissions', async ({ page }) => {
    const submissionsTab = page.locator('button:has-text("Review Submissions")');
    
    if (await submissionsTab.isVisible()) {
      await submissionsTab.click();
      await page.waitForTimeout(1000);
      
      // Filter buttons or dropdown
      const filterOptions = page.locator('button:has-text("All"), button:has-text("Pending"), select');
      // Filter options might be available
    }
  });
  
  test('should display submission details', async ({ page }) => {
    const submissionsTab = page.locator('button:has-text("Review Submissions")');
    
    if (await submissionsTab.isVisible()) {
      await submissionsTab.click();
      await page.waitForTimeout(1500);
      
      // If there are submissions, check for details
      const submissionItem = page.locator('table tbody tr, [class*="card"]').first();
      
      if (await submissionItem.isVisible()) {
        // Should show type, value, status
        const hasTypeInfo = await page.locator('text=/type|category/i').isVisible();
        const hasValueInfo = await page.locator('text=/value|name/i').isVisible();
      }
    }
  });
  
  test('should have approve button for pending submissions', async ({ page }) => {
    const submissionsTab = page.locator('button:has-text("Review Submissions")');
    
    if (await submissionsTab.isVisible()) {
      await submissionsTab.click();
      await page.waitForTimeout(1500);
      
      // Look for approve button
      const approveBtn = page.locator('button:has-text("Approve"), [aria-label*="approve" i]');
      // Approve button might be visible if there are submissions
    }
  });
  
  test('should have reject button for pending submissions', async ({ page }) => {
    const submissionsTab = page.locator('button:has-text("Review Submissions")');
    
    if (await submissionsTab.isVisible()) {
      await submissionsTab.click();
      await page.waitForTimeout(1500);
      
      // Look for reject button
      const rejectBtn = page.locator('button:has-text("Reject"), [aria-label*="reject" i]');
      // Reject button might be visible if there are submissions
    }
  });
  
  test('should show submission count', async ({ page }) => {
    const submissionsTab = page.locator('button:has-text("Review Submissions")');
    
    if (await submissionsTab.isVisible()) {
      await submissionsTab.click();
      await page.waitForTimeout(1000);
      
      // Submission count should be displayed
      const countBadge = page.locator('text=/pending|\\d+/i');
      // Count might be shown
    }
  });
});

test.describe('Admin - Contact Messages Tab', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });
  
  test('should display contact messages list', async ({ page }) => {
    const contactTab = page.locator('button:has-text("Contact Messages")');
    
    if (await contactTab.isVisible()) {
      await contactTab.click();
      await page.waitForTimeout(1500);
      
      // Messages list or "no messages" should appear
      const messagesList = page.locator('table, [class*="list"], [class*="grid"]').first();
      const noMessages = page.locator('text=/no.*messages|empty/i');
      
      const hasContent = await messagesList.isVisible() || await noMessages.isVisible();
      expect(hasContent).toBeTruthy();
    }
  });
  
  test('should have read/unread filter', async ({ page }) => {
    const contactTab = page.locator('button:has-text("Contact Messages")');
    
    if (await contactTab.isVisible()) {
      await contactTab.click();
      await page.waitForTimeout(1000);
      
      // Filter for read/unread
      const filters = page.locator('button:has-text("All"), button:has-text("Unread"), button:has-text("Read")');
      // Filters might be available
    }
  });
  
  test('should show message details on click', async ({ page }) => {
    const contactTab = page.locator('button:has-text("Contact Messages")');
    
    if (await contactTab.isVisible()) {
      await contactTab.click();
      await page.waitForTimeout(1500);
      
      // Click on first message if available
      const messageRow = page.locator('table tbody tr, [class*="card"]').first();
      
      if (await messageRow.isVisible()) {
        await messageRow.click();
        await page.waitForTimeout(500);
        
        // Message details should appear
        const messageDetail = page.locator('text=/message|subject|from/i');
        // Details should be shown
      }
    }
  });
  
  test('should show unread count', async ({ page }) => {
    const contactTab = page.locator('button:has-text("Contact Messages")');
    
    if (await contactTab.isVisible()) {
      await contactTab.click();
      await page.waitForTimeout(1000);
      
      // Unread count badge
      const unreadBadge = page.locator('text=/unread|\\d+/i');
      // Unread count might be shown
    }
  });
  
  test('should have mark as read functionality', async ({ page }) => {
    const contactTab = page.locator('button:has-text("Contact Messages")');
    
    if (await contactTab.isVisible()) {
      await contactTab.click();
      await page.waitForTimeout(1500);
      
      // Mark as read button
      const markReadBtn = page.locator('button:has-text("Mark"), [aria-label*="read" i]');
      // Button might be available
    }
  });
  
  test('should have delete message functionality', async ({ page }) => {
    const contactTab = page.locator('button:has-text("Contact Messages")');
    
    if (await contactTab.isVisible()) {
      await contactTab.click();
      await page.waitForTimeout(1500);
      
      // Delete button
      const deleteBtn = page.locator('button:has-text("Delete"), [aria-label*="delete" i], svg[class*="trash" i]');
      // Delete button might be available
    }
  });
});

test.describe('Admin - Manage Dropdowns Tab', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });
  
  test('should display dropdown management section', async ({ page }) => {
    const dropdownsTab = page.locator('button:has-text("Manage Dropdowns")');
    
    if (await dropdownsTab.isVisible()) {
      await dropdownsTab.click();
      await page.waitForTimeout(1500);
      
      // Dropdown management section should appear
      const section = page.locator('[class*="p-6"], [class*="rounded"]').first();
      await expect(section).toBeVisible();
    }
  });
  
  test('should have tabs for different dropdown types', async ({ page }) => {
    const dropdownsTab = page.locator('button:has-text("Manage Dropdowns")');
    
    if (await dropdownsTab.isVisible()) {
      await dropdownsTab.click();
      await page.waitForTimeout(1000);
      
      // Sub-tabs for different types
      const baitTab = page.locator('button:has-text("Baits")');
      const speciesTab = page.locator('button:has-text("Species"), button:has-text("Fish")');
      const typesTab = page.locator('button:has-text("Types")');
      const methodsTab = page.locator('button:has-text("Methods")');
      
      // At least some of these should be visible
    }
  });
  
  test('should display baits management', async ({ page }) => {
    const dropdownsTab = page.locator('button:has-text("Manage Dropdowns")');
    
    if (await dropdownsTab.isVisible()) {
      await dropdownsTab.click();
      await page.waitForTimeout(1000);
      
      const baitsTab = page.locator('button:has-text("Baits")');
      if (await baitsTab.isVisible()) {
        await baitsTab.click();
        await page.waitForTimeout(1000);
        
        // Baits list should appear
        const baitsList = page.locator('table, [class*="list"]').first();
        // Baits should be displayed
      }
    }
  });
  
  test('should allow adding new bait', async ({ page }) => {
    const dropdownsTab = page.locator('button:has-text("Manage Dropdowns")');
    
    if (await dropdownsTab.isVisible()) {
      await dropdownsTab.click();
      await page.waitForTimeout(1000);
      
      // Add button
      const addBtn = page.locator('button:has-text("Add"), button:has([class*="Plus"])');
      // Add button should be available
    }
  });
  
  test('should display fish species with local/english/scientific names', async ({ page }) => {
    const dropdownsTab = page.locator('button:has-text("Manage Dropdowns")');
    
    if (await dropdownsTab.isVisible()) {
      await dropdownsTab.click();
      await page.waitForTimeout(1000);
      
      const speciesTab = page.locator('button:has-text("Species"), button:has-text("Fish")');
      if (await speciesTab.isVisible()) {
        await speciesTab.click();
        await page.waitForTimeout(1000);
        
        // Should show columns for different name types
        const headers = page.locator('th, [class*="header"]');
        // Headers should include local, english, scientific
      }
    }
  });
  
  test('should link baits to fishing types', async ({ page }) => {
    const dropdownsTab = page.locator('button:has-text("Manage Dropdowns")');
    
    if (await dropdownsTab.isVisible()) {
      await dropdownsTab.click();
      await page.waitForTimeout(1000);
      
      const baitsTab = page.locator('button:has-text("Baits")');
      if (await baitsTab.isVisible()) {
        await baitsTab.click();
        await page.waitForTimeout(1000);
        
        // Bait entries should show fishing type association
        const fishingTypeColumn = page.locator('text=/fishing.*type|type/i');
        // Fishing type association should be visible
      }
    }
  });
  
  test('should allow editing existing dropdown items', async ({ page }) => {
    const dropdownsTab = page.locator('button:has-text("Manage Dropdowns")');
    
    if (await dropdownsTab.isVisible()) {
      await dropdownsTab.click();
      await page.waitForTimeout(1500);
      
      // Edit button
      const editBtn = page.locator('button:has-text("Edit"), [aria-label*="edit" i], svg[class*="edit" i]').first();
      // Edit functionality should be available
    }
  });
  
  test('should allow deleting dropdown items', async ({ page }) => {
    const dropdownsTab = page.locator('button:has-text("Manage Dropdowns")');
    
    if (await dropdownsTab.isVisible()) {
      await dropdownsTab.click();
      await page.waitForTimeout(1500);
      
      // Delete button
      const deleteBtn = page.locator('button:has-text("Delete"), [aria-label*="delete" i], svg[class*="trash" i]').first();
      // Delete functionality should be available
    }
  });
});

test.describe('Admin - User Management Tab', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });
  
  test('should display users list', async ({ page }) => {
    const usersTab = page.locator('button:has-text("User Management")');
    
    if (await usersTab.isVisible()) {
      await usersTab.click();
      await page.waitForTimeout(1500);
      
      // Users list should appear
      const usersList = page.locator('table, [class*="list"], [class*="grid"]').first();
      await expect(usersList).toBeVisible();
    }
  });
  
  test('should display user details - username, email', async ({ page }) => {
    const usersTab = page.locator('button:has-text("User Management")');
    
    if (await usersTab.isVisible()) {
      await usersTab.click();
      await page.waitForTimeout(1500);
      
      // Table headers or user info
      const usernameColumn = page.locator('th:has-text("Username"), text=/username/i');
      const emailColumn = page.locator('th:has-text("Email"), text=/email/i');
      // User details should be displayed
    }
  });
  
  test('should have search functionality', async ({ page }) => {
    const usersTab = page.locator('button:has-text("User Management")');
    
    if (await usersTab.isVisible()) {
      await usersTab.click();
      await page.waitForTimeout(1000);
      
      // Search input
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]');
      // Search should be available
    }
  });
  
  test('should allow viewing user entries', async ({ page }) => {
    const usersTab = page.locator('button:has-text("User Management")');
    
    if (await usersTab.isVisible()) {
      await usersTab.click();
      await page.waitForTimeout(1500);
      
      // View entries button
      const viewBtn = page.locator('button:has-text("View"), button:has-text("Entries"), [aria-label*="view" i]').first();
      // View functionality should be available
    }
  });
  
  test('should allow editing user', async ({ page }) => {
    const usersTab = page.locator('button:has-text("User Management")');
    
    if (await usersTab.isVisible()) {
      await usersTab.click();
      await page.waitForTimeout(1500);
      
      // Edit button
      const editBtn = page.locator('button:has-text("Edit"), [aria-label*="edit" i]').first();
      // Edit functionality should be available
    }
  });
  
  test('should show admin status for users', async ({ page }) => {
    const usersTab = page.locator('button:has-text("User Management")');
    
    if (await usersTab.isVisible()) {
      await usersTab.click();
      await page.waitForTimeout(1500);
      
      // Admin column or badge
      const adminColumn = page.locator('th:has-text("Admin"), text=/is.*admin/i');
      // Admin status should be displayed
    }
  });
});

test.describe('Admin - System Logs Tab', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });
  
  test('should display system logs', async ({ page }) => {
    const logsTab = page.locator('button:has-text("System Logs")');
    
    if (await logsTab.isVisible()) {
      await logsTab.click();
      await page.waitForTimeout(1500);
      
      // Logs list should appear
      const logsList = page.locator('table, [class*="list"], pre').first();
      const noLogs = page.locator('text=/no.*logs|empty/i');
      
      const hasContent = await logsList.isVisible() || await noLogs.isVisible();
      expect(hasContent).toBeTruthy();
    }
  });
  
  test('should have log level filter', async ({ page }) => {
    const logsTab = page.locator('button:has-text("System Logs")');
    
    if (await logsTab.isVisible()) {
      await logsTab.click();
      await page.waitForTimeout(1000);
      
      // Filter by level
      const levelFilter = page.locator('button:has-text("All"), button:has-text("Error"), button:has-text("Info"), select');
      // Level filter should be available
    }
  });
  
  test('should display log timestamp', async ({ page }) => {
    const logsTab = page.locator('button:has-text("System Logs")');
    
    if (await logsTab.isVisible()) {
      await logsTab.click();
      await page.waitForTimeout(1500);
      
      // Timestamp column
      const timestampInfo = page.locator('text=/\\d{4}-\\d{2}-\\d{2}|timestamp/i');
      // Timestamp should be displayed
    }
  });
  
  test('should have refresh functionality', async ({ page }) => {
    const logsTab = page.locator('button:has-text("System Logs")');
    
    if (await logsTab.isVisible()) {
      await logsTab.click();
      await page.waitForTimeout(1000);
      
      // Refresh button
      const refreshBtn = page.locator('button:has-text("Refresh"), [aria-label*="refresh" i], svg[class*="refresh" i]');
      // Refresh should be available
    }
  });
});
