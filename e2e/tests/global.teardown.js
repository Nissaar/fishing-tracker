// @ts-check
const { test: teardown } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * Global Teardown - runs once after every project that depends on `setup`
 * (wired through `teardown: 'teardown'` in playwright.config.js).
 *
 * There is no database cleanup here on purpose: the backend has no endpoint
 * for deleting test data (an earlier version called a non-existent
 * DELETE /admin/cleanup/test-data and swallowed the failure). The suite runs
 * against a throwaway database, which is discarded after the run.
 */
teardown.describe('Global Teardown', () => {

  teardown('Cleanup local test artifacts', async () => {
    const artifactsToClean = [
      'playwright/.auth',
      'test-results/traces',
      'test-results/screenshots',
      'test-results/videos'
    ];

    for (const artifact of artifactsToClean) {
      const artifactPath = path.join(__dirname, '..', artifact);
      // force: true already ignores a missing path, so any error here is real
      fs.rmSync(artifactPath, { recursive: true, force: true });
    }
  });
});
