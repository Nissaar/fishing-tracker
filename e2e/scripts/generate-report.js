/**
 * Generate HTML Test Report
 * Creates a standalone HTML report from test results
 * 
 * Run with: node scripts/generate-report.js
 */

const fs = require('fs');
const path = require('path');

console.log('📊 Generating E2E Test Report...\n');

function generateReport() {
  const resultsPath = path.join(__dirname, '..', 'test-results', 'results.json');
  const outputPath = path.join(__dirname, '..', 'test-results', 'report.html');
  
  // Check if results exist
  if (!fs.existsSync(resultsPath)) {
    console.log('❌ No test results found. Run tests first with: npm test');
    process.exit(1);
  }
  
  // Read results
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  
  // Calculate stats
  const stats = {
    total: results.stats?.expected || 0,
    passed: results.stats?.ok || 0,
    failed: results.stats?.unexpected || 0,
    skipped: results.stats?.skipped || 0,
    duration: results.stats?.duration || 0,
    startTime: results.stats?.startTime || new Date().toISOString()
  };
  
  // Extract test details
  const suites = [];
  if (results.suites) {
    for (const suite of results.suites) {
      processSuite(suite, suites);
    }
  }
  
  // Generate HTML
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fishing Tracker Pro - E2E Test Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header {
      background: white;
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 20px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }
    
    .header h1 {
      font-size: 2rem;
      color: #333;
      margin-bottom: 10px;
    }
    
    .header .subtitle {
      color: #666;
      font-size: 1rem;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 25px;
      text-align: center;
      box-shadow: 0 5px 20px rgba(0,0,0,0.1);
    }
    
    .stat-card.passed { border-left: 5px solid #10b981; }
    .stat-card.failed { border-left: 5px solid #ef4444; }
    .stat-card.skipped { border-left: 5px solid #f59e0b; }
    .stat-card.total { border-left: 5px solid #3b82f6; }
    
    .stat-value {
      font-size: 3rem;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .stat-label {
      color: #666;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .stat-card.passed .stat-value { color: #10b981; }
    .stat-card.failed .stat-value { color: #ef4444; }
    .stat-card.skipped .stat-value { color: #f59e0b; }
    .stat-card.total .stat-value { color: #3b82f6; }
    
    .progress-bar {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.1);
    }
    
    .progress-bar h3 {
      margin-bottom: 15px;
      color: #333;
    }
    
    .progress-container {
      height: 30px;
      background: #e5e7eb;
      border-radius: 15px;
      overflow: hidden;
      display: flex;
    }
    
    .progress-passed {
      background: #10b981;
      height: 100%;
      transition: width 0.5s ease;
    }
    
    .progress-failed {
      background: #ef4444;
      height: 100%;
      transition: width 0.5s ease;
    }
    
    .progress-skipped {
      background: #f59e0b;
      height: 100%;
      transition: width 0.5s ease;
    }
    
    .suites {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.1);
    }
    
    .suites h3 {
      margin-bottom: 20px;
      color: #333;
    }
    
    .suite {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin-bottom: 15px;
      overflow: hidden;
    }
    
    .suite-header {
      background: #f9fafb;
      padding: 15px 20px;
      font-weight: 600;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .suite-tests {
      padding: 10px;
    }
    
    .test {
      padding: 10px 15px;
      border-radius: 6px;
      margin-bottom: 5px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .test:last-child {
      margin-bottom: 0;
    }
    
    .test.passed {
      background: #f0fdf4;
    }
    
    .test.failed {
      background: #fef2f2;
    }
    
    .test.skipped {
      background: #fffbeb;
    }
    
    .test-icon {
      font-size: 1.2rem;
    }
    
    .test-name {
      flex: 1;
      color: #333;
    }
    
    .test-duration {
      color: #666;
      font-size: 0.85rem;
    }
    
    .footer {
      text-align: center;
      padding: 30px;
      color: white;
    }
    
    .footer a {
      color: white;
      text-decoration: underline;
    }
    
    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .stat-value {
        font-size: 2rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎣 Fishing Tracker Pro - E2E Test Report</h1>
      <p class="subtitle">
        Generated on ${new Date().toLocaleString()} | 
        Duration: ${(stats.duration / 1000).toFixed(2)}s
      </p>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card total">
        <div class="stat-value">${stats.total}</div>
        <div class="stat-label">Total Tests</div>
      </div>
      <div class="stat-card passed">
        <div class="stat-value">${stats.passed}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat-card failed">
        <div class="stat-value">${stats.failed}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat-card skipped">
        <div class="stat-value">${stats.skipped}</div>
        <div class="stat-label">Skipped</div>
      </div>
    </div>
    
    <div class="progress-bar">
      <h3>Test Results Distribution</h3>
      <div class="progress-container">
        <div class="progress-passed" style="width: ${stats.total ? (stats.passed / stats.total * 100) : 0}%"></div>
        <div class="progress-failed" style="width: ${stats.total ? (stats.failed / stats.total * 100) : 0}%"></div>
        <div class="progress-skipped" style="width: ${stats.total ? (stats.skipped / stats.total * 100) : 0}%"></div>
      </div>
    </div>
    
    <div class="suites">
      <h3>Test Suites</h3>
      ${generateSuitesHTML(suites)}
    </div>
    
    <div class="footer">
      <p>
        Powered by <a href="https://playwright.dev">Playwright</a> | 
        Fishing Tracker Pro © ${new Date().getFullYear()}
      </p>
    </div>
  </div>
</body>
</html>
`;
  
  // Write report
  fs.writeFileSync(outputPath, html);
  
  console.log(`✅ Report generated: ${outputPath}`);
  console.log(`\n📊 Test Summary:`);
  console.log(`   Total: ${stats.total}`);
  console.log(`   Passed: ${stats.passed} (${stats.total ? ((stats.passed / stats.total) * 100).toFixed(1) : 0}%)`);
  console.log(`   Failed: ${stats.failed}`);
  console.log(`   Skipped: ${stats.skipped}`);
  console.log(`   Duration: ${(stats.duration / 1000).toFixed(2)}s`);
}

function processSuite(suite, suites, parentTitle = '') {
  const title = parentTitle ? `${parentTitle} > ${suite.title}` : suite.title;
  
  if (suite.specs && suite.specs.length > 0) {
    const tests = suite.specs.map(spec => ({
      name: spec.title,
      status: getStatus(spec),
      duration: spec.tests?.[0]?.results?.[0]?.duration || 0
    }));
    
    suites.push({ title, tests });
  }
  
  if (suite.suites) {
    for (const child of suite.suites) {
      processSuite(child, suites, title);
    }
  }
}

function getStatus(spec) {
  if (!spec.tests || spec.tests.length === 0) return 'skipped';
  const result = spec.tests[0].results?.[0];
  if (!result) return 'skipped';
  if (result.status === 'passed') return 'passed';
  if (result.status === 'failed') return 'failed';
  if (result.status === 'skipped') return 'skipped';
  return 'passed';
}

function generateSuitesHTML(suites) {
  if (suites.length === 0) {
    return '<p style="color: #666; padding: 20px;">No test suites found.</p>';
  }
  
  return suites.map(suite => `
    <div class="suite">
      <div class="suite-header">
        <span>${escapeHtml(suite.title)}</span>
        <span>${suite.tests.length} tests</span>
      </div>
      <div class="suite-tests">
        ${suite.tests.map(test => `
          <div class="test ${test.status}">
            <span class="test-icon">${getIcon(test.status)}</span>
            <span class="test-name">${escapeHtml(test.name)}</span>
            <span class="test-duration">${test.duration}ms</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function getIcon(status) {
  switch (status) {
    case 'passed': return '✅';
    case 'failed': return '❌';
    case 'skipped': return '⏭️';
    default: return '❓';
  }
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

generateReport();
