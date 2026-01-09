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
      const res = await axios.get(ep.url, { timeout: 10000 });
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
    console.log(`Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    report.push({ step: 'Landing loads', ok: true });
    console.log('✓ Landing page loaded');

    // Navigate to Log Trip (public UI sanity)
    console.log('Attempting to click "Log Trip" button...');
    const logTripClicked = await page.click('text=Log Trip', { timeout: 8000 }).then(() => true).catch((err) => {
      console.log(`✗ Failed to click Log Trip: ${err.message}`);
      return false;
    });
    
    if (logTripClicked) {
      await page.waitForTimeout(1000);
      console.log('✓ Clicked Log Trip button');
      
      const dateField = await page.isVisible('input[type="date"]').catch(() => false);
      report.push({ step: 'Log Trip form visible', ok: dateField });
      console.log(`${dateField ? '✓' : '✗'} Date field visible: ${dateField}`);
      
      const tideCard = await page.locator('text=Tide').first().isVisible().catch(() => false);
      report.push({ step: 'Tide card visible', ok: tideCard });
      console.log(`${tideCard ? '✓' : '✗'} Tide card visible: ${tideCard}`);

      // Simple visual asserts on key cards
      const moonVisible = await page.locator('text=Moon').first().isVisible().catch(() => false);
      report.push({ step: 'Moon card visible', ok: moonVisible });
      console.log(`${moonVisible ? '✓' : '✗'} Moon card visible: ${moonVisible}`);
    } else {
      report.push({ step: 'Log Trip button click', ok: false, error: 'Button not found or not clickable' });
    }
  } catch (err) {
    console.error(`✗ UI navigation error: ${err.message}`);
    report.push({ step: 'UI navigation', ok: false, error: err.message });
  } finally {
    await browser.close();
  }
  return report;
}

(async () => {
  console.log('=== Starting Prod Check ===');
  console.log(`Base URL: ${BASE_URL}`);
  
  const api = await apiCheck();
  console.log('\n=== API Check Results ===');
  console.log(JSON.stringify(api, null, 2));
  
  const ui = await uiCheck();
  console.log('\n=== UI Check Results ===');
  console.log(JSON.stringify(ui, null, 2));
  
  const summary = { baseUrl: BASE_URL, api, ui, time: new Date().toISOString() };

  // Write HTML report
  const html = `<!DOCTYPE html><html><body>
    <h2>Prod Check Report</h2>
    <p>Base URL: ${BASE_URL}</p>
    <pre>${JSON.stringify(summary, null, 2)}</pre>
  </body></html>`;
  fs.mkdirSync('.github/scripts', { recursive: true });
  fs.writeFileSync('.github/scripts/prod-check-report.html', html, 'utf8');
  console.log('\n✓ Report written to .github/scripts/prod-check-report.html');

  // Fail run if any check failed
  const failed = [
    ...api.filter(r => r.status !== 200),
    ...ui.filter(r => !r.ok)
  ];
  if (failed.length) {
    console.error('\n=== FAILURES DETECTED ===');
    console.error(JSON.stringify(failed, null, 2));
    process.exit(1);
  }
  
  console.log('\n=== All Checks Passed ===');
})();
