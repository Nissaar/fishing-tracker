# E2E Test Documentation

This document provides detailed information about each E2E test, including manual reproduction steps.

## Setup Requirements

- Backend running at: http://localhost:5000
- Frontend running at: http://localhost:3000
- Database: PostgreSQL with test data initialized
- Test users created in database

### Test User Credentials

```
Regular User:
Email: e2etest@fishingtracker.mu
Password: password

Admin User:
Email: admin@fishingtracker.mu
Password: password
```

---

## Public Pages Tests

### Landing Page - Navigation Links
**File:** `tests/public/public-pages.spec.js`

**Manual Reproduction:**
1. Open http://localhost:3000
2. Verify navigation links visible:
   - "About" link
   - "Contact" link
   - "Sign In" link (leads to /login)
   - "Get Started" button (leads to /register)
3. Verify hero section with fishing conditions

**Expected Result:** All navigation elements should be visible and functional

---

## Authentication Tests

### Login - Valid Credentials
**File:** `tests/auth/authentication.spec.js`

**Manual Reproduction:**
1. Navigate to http://localhost:3000/login
2. Enter email: `e2etest@fishingtracker.mu`
3. Enter password: `password`
4. Click "Login" button
5. Wait for redirect

**Expected Result:** 
- User redirected to /dashboard
- Token saved in localStorage
- User info displayed in header

### Registration - New Account
**File:** `tests/auth/authentication.spec.js`

**Manual Reproduction:**
1. Navigate to http://localhost:3000/register
2. Fill in registration form:
   - Username: Any unique username
   - Email: Any unique valid email (can be fake like test@test.com)
   - Password: Must be 8+ chars with uppercase, lowercase, number, special char (e.g., `Test@1234`)
   - Confirm Password: Same as password
3. Click "Register" button
4. Wait for response

**Expected Result:**
- Either redirect to /dashboard (auto-login) or /login (manual login needed)
- No validation errors
- Success message shown

### Logout
**File:** `tests/auth/authentication.spec.js`

**Manual Reproduction:**
1. Login with test credentials (see above)
2. Click logout button in header
3. Verify redirect to homepage
4. Check localStorage - token should be cleared

**Expected Result:**
- User logged out
- Redirect to homepage or login
- Cannot access /dashboard without re-login

---

## Dashboard Tests

### Log Trip - Form Submission
**File:** `tests/dashboard/logtrip.spec.js`

**Manual Reproduction:**
1. Login with test user
2. Navigate to Dashboard > Log Trip tab
3. Fill in form:
   - **Date:** Select today (auto-filled)
   - **Time Start:** Select time (e.g., 08:00)
   - **Time End:** Select time (e.g., 16:00)
   - **Location:** Search and select (e.g., "Trou aux Biches")
   - **Fishing Type:** Select from dropdown (e.g., "Casting")
   - **Caught Fish:** Select "Yes"
   - **Fish Count:** Enter number (e.g., 3)
   - **Fish Species:** Select species for each fish
   - **Bait Type:** Select bait used
   - **Notes:** Optional comments
4. Click "Submit" button
5. Wait for confirmation

**Expected Result:**
- Form submits successfully
- Entry appears in View Data tab
- Data persists after refresh
- Environmental data displayed (weather, tide, moon phase)

### View Data - Table Display
**File:** `tests/dashboard/dashboard.spec.js`

**Manual Reproduction:**
1. Login and navigate to Dashboard > View Data tab
2. Verify table columns:
   - Date, Time, Location, Fishing Type, Caught Fish, Fish Count, Bait Used, Notes
3. Click Edit button on any row
4. Modify data and save
5. Click Delete button
6. Confirm deletion in dialog

**Expected Result:**
- Table shows all logged trips
- Edit functionality works
- Delete removes entry
- Data updates in real-time

### Plan Trip - Recommendations
**File:** `tests/dashboard/dashboard.spec.js`

**Manual Reproduction:**
1. Login and navigate to Dashboard > Plan Trip tab
2. Fill in form:
   - Location: Select target location
   - Fishing Type: Select method
   - Date: Select future date
   - Time Range: Select start/end time
   - Bait Type: Select (auto-filtered by fishing type)
3. Click "Get Recommendations" button
4. Wait for API response (5-10 seconds)

**Expected Result:**
- Recommendations displayed including:
  - Best moon phase
  - Optimal tide conditions
  - Success rate prediction
  - Environmental data for selected date/location

### Predictions - Community Insights
**File:** `tests/dashboard/dashboard.spec.js`

**Manual Reproduction:**
1. Login and navigate to Dashboard > Predictions tab
2. Verify sections:
   - "Community Fishing Insights" header
   - "Today's Conditions vs Best Conditions" comparison
   - Moon phase information with emoji
   - Tide level information
   - Best bait recommendations
3. Scroll to see all cards

**Expected Result:**
- Predictions loaded from community data
- Moon phase, tide, and weather displayed
- Comparison shows if today matches best conditions
- All data from successful trips analyzed

---

## Admin Tests

### Admin Dashboard - Overview
**File:** `tests/admin/admin.spec.js`

**Manual Reproduction:**
1. Login with admin credentials (email: admin@fishingtracker.mu)
2. You should automatically see admin tabs
3. Click "Overview" tab
4. Verify statistics displayed:
   - Total users count
   - Total fishing logs count
   - Most active users
   - Popular locations

**Expected Result:**
- Admin panel visible only to admin users
- Statistics accurate and updated
- Non-admin users redirected

### Admin - Dropdown Management
**File:** `tests/admin/admin.spec.js`

**Manual Reproduction:**
1. Login as admin
2. Navigate to Admin > Dropdowns tab
3. Select dropdown type (Baits, Fish Species, Fishing Types, etc.)
4. **Add new item:** Click "Add" button, fill form, submit
5. **Edit item:** Click Edit on existing item, modify, save
6. **Delete item:** Click Delete on item, confirm

**Expected Result:**
- New items appear in user dropdowns
- Edits persist
- Deletions remove from all references
- No duplicate names allowed

### Admin - User Management
**File:** `tests/admin/admin.spec.js`

**Manual Reproduction:**
1. Login as admin
2. Navigate to Admin > User Management tab
3. View list of users with:
   - Username, Email, Admin status
   - Created date
4. Click on user to view their entries
5. Toggle admin status with checkbox
6. Search users by email

**Expected Result:**
- All users listed with correct info
- Can promote/demote admin status
- Can view user's fishing logs
- Can search and filter users

---

## API Tests

### Fishing Locations API
**File:** `tests/api/api.spec.js`

**Manual Reproduction:**
1. Get auth token:
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"e2etest@fishingtracker.mu","password":"password"}'
   ```
2. Call locations endpoint:
   ```bash
   curl http://localhost:5000/api/fishing/locations \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

**Expected Response:**
```json
[
  {
    "id": 1,
    "name": "Trou aux Biches",
    "lat": -20.1234,
    "lon": 57.5678,
    "province": "Rivière du Rempart"
  },
  ...
]
```

### Environmental Data API
**File:** `tests/api/api.spec.js`

**Manual Reproduction:**
1. Get auth token (see above)
2. Call environmental data:
   ```bash
   curl "http://localhost:5000/api/fishing/environmental-data?date=2024-02-03&locationId=1" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

**Expected Response:**
```json
{
  "weather": {
    "temperature": 28,
    "condition": "Sunny",
    "windSpeed": 10
  },
  "tide": {
    "level": "high",
    "time": "14:30",
    "type": "rising"
  },
  "moonPhase": {
    "phase": "Waxing Gibbous",
    "illumination": 85
  }
}
```

### Fishing Statistics API
**File:** `tests/api/api.spec.js`

**Manual Reproduction:**
1. Get auth token
2. Call statistics:
   ```bash
   curl http://localhost:5000/api/fishing/statistics \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

**Expected Response:**
```json
{
  "totalTrips": 15,
  "totalFishCaught": 42,
  "successRate": 86.7,
  "averageFishPerTrip": 2.8,
  "mostProductiveLocation": "Trou aux Biches",
  "mostUsedBait": "Calamar"
}
```

---

## Reproduction in Local Environment

### Start Services
```bash
# Terminal 1: Database
docker-compose up postgres

# Terminal 2: Backend
cd backend
npm install
npm start

# Terminal 3: Frontend
cd frontend
npm install
REACT_APP_API_URL=http://localhost:5000/api npm start

# Terminal 4: Tests
cd e2e
npm install
npx playwright test
```

### Run Specific Test File
```bash
npx playwright test tests/auth/authentication.spec.js
```

### Run Test with UI Mode (Debug)
```bash
npx playwright test --ui
```

### View Test Report
```bash
npx playwright show-report
```

---

## Common Issues & Troubleshooting

### "Element not found" Error
- **Cause:** Page not fully loaded
- **Fix:** Add longer `waitForLoadState('networkidle')` or `waitForTimeout(2000)`

### "Timeout" Error
- **Cause:** API call or redirect takes too long
- **Fix:** Increase timeout: `await page.waitForURL(url, { timeout: 15000 })`

### "API Connection Refused"
- **Cause:** Backend not running
- **Fix:** Start backend: `cd backend && npm start`

### Test Fails Locally But Passes in CI
- **Cause:** Timing differences or network speed
- **Fix:** Add explicit waits for network calls to complete

---

## Test Execution Timeline

**All 165 tests:** ~6 minutes
- Setup auth: ~10 seconds
- Public/Auth tests: ~2 minutes
- Dashboard tests: ~2.5 minutes
- Admin tests: ~1 minute
- API tests: ~30 seconds

---

Generated: 2026-02-03
Last Updated: See git log for history
