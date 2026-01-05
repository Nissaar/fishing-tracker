// Basic prod smoke: landing loads, auth endpoints reachable, dashboard cards render
const fs = require('fs');
const axios = require('axios');
const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'https://fishing.nissaar.com';

async function apiCheck() {
  const results = [];
  const endpoints = [
    { name: 'Health', url: `${BASE_URL}/api/health` },
    { name: 'Public locations', url: `${BASE_URL}/api/fishing/locations` }
  ];
  for (const ep of endpoints) {
    try {
      const res = await axios.get(ep.url, { timeout: 8000 });
      results.push({ ...ep, status: res.status });
    } catch (err) {
      results.push({ ...ep, error: err.message });
    }
  }
  return results;
}

async function uiCheck() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const report = [];
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1000);
    report.push({ step: 'Landing loads', ok: true });

    // Navigate to Log Trip (public UI sanity)
    await page.click('text=Log Trip', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    const dateField = await page.isVisible('input[type="date"]').catch(() => false);
    const tideCard = await page.locator('text=Tide').first().isVisible().catch(() => false);
    report.push({ step: 'Log Trip form visible', ok: dateField });
    report.push({ step: 'Tide card visible', ok: tideCard });

    // Simple visual asserts on key cards
    const moonVisible = await page.locator('text=Moon').first().isVisible().catch(() => false);
    report.push({ step: 'Moon card visible', ok: moonVisible });
  } catch (err) {
    report.push({ step: 'UI navigation', ok: false, error: err.message });
  } finally {
    await browser.close();
  }
  return report;
}

(async () => {
  const api = await apiCheck();
  const ui = await uiCheck();
  const summary = { baseUrl: BASE_URL, api, ui, time: new Date().toISOString() };

  // Write HTML report
  const html = `<!DOCTYPE html><html><body>
    <h2>Prod Check Report</h2>
    <p>Base URL: ${BASE_URL}</p>
    <pre>${JSON.stringify(summary, null, 2)}</pre>
  </body></html>`;
  fs.mkdirSync('.github/scripts', { recursive: true });
  fs.writeFileSync('.github/scripts/prod-check-report.html', html, 'utf8');

  // Fail run if any check failed
  const failed = [
    ...api.filter(r => r.status !== 200),
    ...ui.filter(r => !r.ok)
  ];
  if (failed.length) {
    console.error('Failures:', failed);
    process.exit(1);
  }
})();
