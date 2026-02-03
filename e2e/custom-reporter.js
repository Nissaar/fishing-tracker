/**
 * Custom Playwright Reporter
 * Generates HTML summary with test documentation and manual reproduction steps
 */

const fs = require('fs');
const path = require('path');

class TestDocumentationReporter {
  onTestEnd(test, result) {
    // Tests will be collected and report generated at end
  }

  onEnd(result) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E2E Test Report with Documentation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      padding: 40px 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      margin-bottom: 40px;
      text-align: center;
    }
    .header h1 {
      color: #667eea;
      margin-bottom: 10px;
      font-size: 2.5em;
    }
    .header p {
      color: #666;
      font-size: 1.1em;
      margin-bottom: 20px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }
    .stat-box {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-box .number {
      font-size: 2.5em;
      font-weight: bold;
    }
    .stat-box .label {
      margin-top: 10px;
      font-size: 0.9em;
      opacity: 0.9;
    }
    .test-guide {
      background: white;
      padding: 40px;
      border-radius: 12px;
      margin-bottom: 40px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .test-guide h2 {
      color: #667eea;
      margin-bottom: 20px;
      font-size: 1.8em;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
    }
    .test-section {
      margin-bottom: 40px;
    }
    .test-section h3 {
      color: #764ba2;
      margin-bottom: 15px;
      font-size: 1.3em;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .test-section h3::before {
      content: '✓';
      color: #28a745;
      font-weight: bold;
      font-size: 1.3em;
    }
    .test-case {
      background: #f8f9fa;
      padding: 20px;
      border-left: 4px solid #667eea;
      margin-bottom: 15px;
      border-radius: 4px;
    }
    .test-case h4 {
      color: #667eea;
      margin-bottom: 10px;
      font-size: 1.1em;
    }
    .steps {
      list-style: none;
      padding: 0;
      margin: 15px 0;
    }
    .steps li {
      padding: 8px 0 8px 30px;
      position: relative;
      line-height: 1.6;
      color: #555;
    }
    .steps li::before {
      content: attr(data-step);
      position: absolute;
      left: 0;
      top: 5px;
      background: #667eea;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8em;
      font-weight: bold;
    }
    .expected {
      margin-top: 15px;
      padding: 12px;
      background: #d4edda;
      border-left: 4px solid #28a745;
      border-radius: 4px;
      color: #155724;
    }
    .expected strong {
      display: block;
      margin-bottom: 5px;
    }
    .credentials {
      background: #fff3cd;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      border-left: 4px solid #ffc107;
    }
    .credentials h4 {
      color: #856404;
      margin-bottom: 15px;
    }
    .credential-box {
      background: white;
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 4px;
      font-family: monospace;
      color: #333;
    }
    .credential-box strong {
      color: #667eea;
      display: block;
      margin-bottom: 5px;
    }
    .footer {
      text-align: center;
      color: white;
      padding: 20px;
      background: rgba(0,0,0,0.2);
      border-radius: 8px;
      margin-top: 40px;
    }
    .api-endpoint {
      background: #f0f4ff;
      padding: 12px;
      border-radius: 4px;
      font-family: monospace;
      color: #333;
      margin: 10px 0;
      border-left: 4px solid #667eea;
    }
    .warning {
      background: #f8d7da;
      border-left: 4px solid #dc3545;
      padding: 12px;
      border-radius: 4px;
      color: #721c24;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎣 Fishing Tracker E2E Test Report</h1>
      <p>Comprehensive test documentation with manual reproduction steps</p>
      
      <div class="stats">
        <div class="stat-box">
          <div class="number">${result.stats.expected}</div>
          <div class="label">Total Tests</div>
        </div>
        <div class="stat-box">
          <div class="number">${result.stats.expected - result.stats.failed}</div>
          <div class="label">Passed</div>
        </div>
        <div class="stat-box">
          <div class="number">${result.stats.failed}</div>
          <div class="label">Failed</div>
        </div>
        <div class="stat-box">
          <div class="number">${result.stats.skipped}</div>
          <div class="label">Skipped</div>
        </div>
      </div>
    </div>

    <div class="test-guide">
      <h2>📋 Test Documentation & Reproduction Guide</h2>

      <div class="credentials">
        <h4>🔐 Test Credentials</h4>
        <div class="credential-box">
          <strong>Regular Test User:</strong>
          Email: e2etest@fishingtracker.mu<br>
          Password: password
        </div>
        <div class="credential-box">
          <strong>Admin Test User:</strong>
          Email: admin@fishingtracker.mu<br>
          Password: password
        </div>
      </div>

      <div class="test-section">
        <h3>Public Pages - No Authentication Required</h3>
        
        <div class="test-case">
          <h4>Landing Page</h4>
          <ol class="steps">
            <li data-step="1">Open http://localhost:3000 in browser</li>
            <li data-step="2">Wait for page to fully load</li>
            <li data-step="3">Verify main heading (h1) is visible</li>
            <li data-step="4">Check navigation links: About, Contact, Sign In, Get Started</li>
            <li data-step="5">Scroll down to verify fishing conditions section</li>
          </ol>
          <div class="expected">
            <strong>Expected Result:</strong>
            Landing page displays with all navigation elements visible. Fishing conditions data loads from API.
          </div>
        </div>

        <div class="test-case">
          <h4>About Page</h4>
          <ol class="steps">
            <li data-step="1">From landing page, click "About" link</li>
            <li data-step="2">Wait for page to load</li>
            <li data-step="3">Verify content is displayed</li>
            <li data-step="4">Check navigation back to home</li>
          </ol>
          <div class="expected">
            <strong>Expected Result:</strong>
            About page displays app information and features.
          </div>
        </div>
      </div>

      <div class="test-section">
        <h3>Authentication - Login & Registration</h3>

        <div class="test-case">
          <h4>Login with Valid Credentials</h4>
          <ol class="steps">
            <li data-step="1">Navigate to http://localhost:3000/login</li>
            <li data-step="2">Enter email: e2etest@fishingtracker.mu</li>
            <li data-step="3">Enter password: password</li>
            <li data-step="4">Click "Login" button</li>
            <li data-step="5">Wait for redirect to /dashboard</li>
          </ol>
          <div class="expected">
            <strong>Expected Result:</strong>
            User is authenticated and redirected to dashboard. Auth token saved in localStorage. User info shown in header.
          </div>
        </div>

        <div class="test-case">
          <h4>Registration - New Account</h4>
          <ol class="steps">
            <li data-step="1">Navigate to http://localhost:3000/register</li>
            <li data-step="2">Fill username field (any unique name)</li>
            <li data-step="3">Fill email field (can be fake like test@test.com)</li>
            <li data-step="4">Fill password field: Test@1234 (min 8 chars with uppercase, lowercase, number, special char)</li>
            <li data-step="5">Fill confirm password field with same password</li>
            <li data-step="6">Click "Register" button</li>
            <li data-step="7">Wait for response or redirect</li>
          </ol>
          <div class="expected">
            <strong>Expected Result:</strong>
            Account created successfully. Either auto-login to dashboard or redirect to login page.
          </div>
        </div>

        <div class="test-case">
          <h4>Logout</h4>
          <ol class="steps">
            <li data-step="1">While logged in, look for logout button (usually in header/menu)</li>
            <li data-step="2">Click logout button</li>
            <li data-step="3">Verify redirect to homepage or login page</li>
            <li data-step="4">Open browser DevTools > Application > LocalStorage</li>
            <li data-step="5">Verify 'token' key is removed</li>
          </ol>
          <div class="expected">
            <strong>Expected Result:</strong>
            User logged out. Auth token cleared. Cannot access protected routes without re-login.
          </div>
        </div>
      </div>

      <div class="test-section">
        <h3>Dashboard - Authenticated User Features</h3>

        <div class="warning">
          <strong>Note:</strong> All dashboard tests require authentication. Login first before testing these features.
        </div>

        <div class="test-case">
          <h4>Log Trip - Record Fishing Session</h4>
          <ol class="steps">
            <li data-step="1">Login and navigate to Dashboard</li>
            <li data-step="2">Click "Log Trip" tab</li>
            <li data-step="3">Fill date field (today's date is pre-filled)</li>
            <li data-step="4">Fill time start and time end</li>
            <li data-step="5">Search and select location (e.g., "Trou aux Biches")</li>
            <li data-step="6">Select fishing type from dropdown (e.g., "Casting")</li>
            <li data-step="7">Select "Caught Fish: Yes"</li>
            <li data-step="8">Enter fish count: 3</li>
            <li data-step="9">Select fish species for each count</li>
            <li data-step="10">Select bait type (options filter by fishing type)</li>
            <li data-step="11">Add optional notes</li>
            <li data-step="12">Click "Submit" button</li>
          </ol>
          <div class="expected">
            <strong>Expected Result:</strong>
            Fishing log saved successfully. Entry appears in View Data tab. Environmental data (weather, tide, moon phase) is fetched and displayed.
          </div>
        </div>

        <div class="test-case">
          <h4>View Data - See Logged Trips</h4>
          <ol class="steps">
            <li data-step="1">Click "View Data" tab in Dashboard</li>
            <li data-step="2">Verify table displays all your logged trips</li>
            <li data-step="3">Click "Edit" button on any row to modify entry</li>
            <li data-step="4">Update fields and save</li>
            <li data-step="5">Click "Delete" button to remove entry</li>
            <li data-step="6">Confirm deletion in dialog</li>
          </ol>
          <div class="expected">
            <strong>Expected Result:</strong>
            Table shows all logged trips. Edit and delete operations work. Changes persist after refresh.
          </div>
        </div>

        <div class="test-case">
          <h4>Plan Trip - Get Recommendations</h4>
          <ol class="steps">
            <li data-step="1">Click "Plan Trip" tab</li>
            <li data-step="2">Select a location you want to fish</li>
            <li data-step="3">Select fishing type (bait type filters automatically)</li>
            <li data-step="4">Select future date</li>
            <li data-step="5">Select time range (e.g., 08:00 - 16:00)</li>
            <li data-step="6">Click "Get Recommendations" button</li>
            <li data-step="7">Wait 5-10 seconds for API response</li>
          </ol>
          <div class="expected">
            <strong>Expected Result:</strong>
            Recommendations displayed including best moon phase, tide level, success rate, and weather forecast for selected date/location.
          </div>
        </div>

        <div class="test-case">
          <h4>Predictions - Community Insights</h4>
          <ol class="steps">
            <li data-step="1">Click "Predictions" tab</li>
            <li data-step="2">View "Community Fishing Insights" section</li>
            <li data-step="3">Compare today's conditions vs best conditions</li>
            <li data-step="4">Check moon phase with emoji indicator</li>
            <li data-step="5">Review tide level and weather info</li>
            <li data-step="6">Scroll to see best bait recommendations</li>
          </ol>
          <div class="expected">
            <strong>Expected Result:</strong>
            Insights displayed showing community data analysis. Today's conditions compared to historically best conditions for fishing success.
          </div>
        </div>
      </div>

      <div class="test-section">
        <h3>Admin Features</h3>

        <div class="test-case">
          <h4>Admin Dashboard - Access Control</h4>
          <ol class="steps">
            <li data-step="1">Login with admin credentials (admin@fishingtracker.mu)</li>
            <li data-step="2">Navigate to /admin or look for Admin menu</li>
            <li data-step="3">Verify admin-only tabs visible: Overview, Submissions, Messages, Dropdowns, Users, Logs</li>
          </ol>
          <div class="expected">
            <strong>Expected Result:</strong>
            Admin user sees admin panel. Regular users attempting to access /admin are redirected to dashboard.
          </div>
        </div>

        <div class="test-case">
          <h4>Admin - Dropdown Management</h4>
          <ol class="steps">
            <li data-step="1">As admin, click "Dropdowns" tab</li>
            <li data-step="2">Select dropdown type (Baits, Fish Species, Fishing Types)</li>
            <li data-step="3">Click "Add" button</li>
            <li data-step="4">Fill in item details and save</li>
            <li data-step="5">Verify new item appears in list</li>
            <li data-step="6">Click "Edit" on item to modify</li>
            <li data-step="7">Click "Delete" to remove item</li>
          </ol>
          <div class="expected">
            <strong>Expected Result:</strong>
            Dropdown items managed successfully. New items appear in user-facing dropdowns. Deletions remove from all references.
          </div>
        </div>

        <div class="test-case">
          <h4>Admin - User Management</h4>
          <ol class="steps">
            <li data-step="1">Click "User Management" tab</li>
            <li data-step="2">View list of all users with username, email, admin status</li>
            <li data-step="3">Click on user to view their fishing logs</li>
            <li data-step="4">Toggle admin checkbox to promote/demote user</li>
            <li data-step="5">Search users by email</li>
          </ol>
          <div class="expected">
            <strong>Expected Result:</strong>
            All users listed with correct information. Can manage admin status. Can view user's activity history.
          </div>
        </div>
      </div>

      <div class="test-section">
        <h3>API Testing - Backend Endpoints</h3>

        <div class="test-case">
          <h4>Get Fishing Locations</h4>
          <div class="api-endpoint">
            <strong>GET</strong> /api/fishing/locations
          </div>
          <ol class="steps">
            <li data-step="1">Get auth token: POST /api/auth/login with test credentials</li>
            <li data-step="2">Call endpoint with Bearer token</li>
            <li data-step="3">Verify response status: 200 OK</li>
            <li data-step="4">Verify response is JSON array of locations</li>
          </ol>
          <div class="expected">
            <strong>Expected Response:</strong>
            Array of location objects with properties: id, name, lat, lon, province
          </div>
        </div>

        <div class="test-case">
          <h4>Get Environmental Data</h4>
          <div class="api-endpoint">
            <strong>GET</strong> /api/fishing/environmental-data?date=2024-02-03&locationId=1
          </div>
          <ol class="steps">
            <li data-step="1">Include date and locationId as query parameters</li>
            <li data-step="2">Include Bearer token in Authorization header</li>
            <li data-step="3">Verify response status: 200 OK</li>
            <li data-step="4">Check response includes weather, tide, moon phase data</li>
          </ol>
          <div class="expected">
            <strong>Expected Response:</strong>
            Object with weather (temp, condition, wind), tide (level, time, type), moonPhase (phase, illumination)
          </div>
        </div>

        <div class="test-case">
          <h4>Create Fishing Log</h4>
          <div class="api-endpoint">
            <strong>POST</strong> /api/fishing/logs
          </div>
          <ol class="steps">
            <li data-step="1">Send POST request with fishing log data in JSON body</li>
            <li data-step="2">Required fields: date, location, fishingType, caughtFish, fishCount</li>
            <li data-step="3">Include Bearer token in Authorization header</li>
            <li data-step="4">Verify response status: 201 Created</li>
          </ol>
          <div class="expected">
            <strong>Expected Response:</strong>
            Created log object with id and timestamp. Log appears in database.
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>📚 Complete test documentation for Fishing Tracker Pro E2E Test Suite</p>
      <p>Generated: ${new Date().toLocaleString()} | Total Test Time: ${Math.round(result.durationMillis / 1000)}s</p>
    </div>
  </div>
</body>
</html>
    `;

    const reportDir = path.join(__dirname, 'playwright-report');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(path.join(reportDir, 'test-documentation.html'), htmlContent);
    console.log('✅ Test documentation report generated: playwright-report/test-documentation.html');
  }
}

module.exports = TestDocumentationReporter;
