# E2E Testing Suite - Fishing Tracker Pro

Comprehensive end-to-end testing suite for Fishing Tracker Pro using Playwright.

## 🎯 Features

- **Complete UI Testing**: Tests all pages, forms, and user interactions
- **API Testing**: Validates all backend endpoints
- **Authentication Testing**: Login, registration, protected routes
- **Dashboard Testing**: All dashboard tabs and features
- **Admin Testing**: Admin panel functionality
- **Cross-Browser Testing**: Chrome, Firefox, Mobile Chrome
- **Automated CI/CD**: GitHub Actions integration
- **HTML Reports**: Beautiful test reports

## 📁 Test Structure

```
e2e/
├── tests/
│   ├── global.setup.js       # Test user creation and auth
│   ├── global.teardown.js    # Cleanup after tests
│   ├── fixtures.js           # Reusable test fixtures
│   ├── public/
│   │   └── public-pages.spec.js    # Public pages tests
│   ├── auth/
│   │   └── authentication.spec.js  # Auth flow tests
│   ├── dashboard/
│   │   ├── dashboard.spec.js       # Dashboard navigation
│   │   └── logtrip.spec.js         # Log trip functionality
│   ├── admin/
│   │   └── admin.spec.js           # Admin panel tests
│   └── api/
│       └── api.spec.js             # API endpoint tests
├── scripts/
│   ├── run-tests.sh          # Linux/Mac test runner
│   ├── run-tests.ps1         # Windows PowerShell runner
│   ├── cleanup.js            # Cleanup test data
│   └── generate-report.js    # Custom report generator
├── docker-compose.test.yml   # Docker test environment
├── init-test-users.sql       # Test database setup
├── playwright.config.js      # Playwright configuration
└── package.json
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 9+
- Docker (optional, for containerized testing)

### Installation

```bash
cd e2e
npm install
npx playwright install --with-deps chromium firefox
```

### Running Tests

#### All Tests
```bash
npm test
```

#### With Browser Visible
```bash
npm run test:headed
```

#### Interactive UI Mode
```bash
npm run test:ui
```

#### Debug Mode
```bash
npm run test:debug
```

#### Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=mobile-chrome
```

#### Specific Test File
```bash
npx playwright test tests/auth/authentication.spec.js
```

#### View Report
```bash
npm run test:report
```

## 🐳 Docker Testing

Run tests in an isolated Docker environment:

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run tests
docker-compose -f docker-compose.test.yml run --rm playwright

# Cleanup
docker-compose -f docker-compose.test.yml down
```

Or use the runner script:

```bash
# Linux/Mac
./scripts/run-tests.sh --docker

# Windows
.\scripts\run-tests.ps1 -Docker
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TEST_BASE_URL` | Frontend URL | `http://localhost:80` |
| `TEST_API_URL` | Backend API URL | `http://localhost:5000/api` |
| `TEST_USER_EMAIL` | Test user email | `e2etest@fishingtracker.mu` |
| `TEST_USER_PASSWORD` | Test user password | `E2ETestPassword123!` |
| `TEST_ADMIN_EMAIL` | Admin user email | `admin@fishingtracker.mu` |
| `TEST_ADMIN_PASSWORD` | Admin user password | `AdminPassword123!` |

### Playwright Config

Edit `playwright.config.js` to customize:
- Browser projects
- Timeouts
- Parallel workers
- Reporters

## 📊 Test Coverage

### Public Pages
- ✅ Landing page rendering
- ✅ Navigation links
- ✅ Fishing conditions display
- ✅ About page
- ✅ Contact form & submission
- ✅ Privacy policy
- ✅ Data sources

### Authentication
- ✅ Login form validation
- ✅ Login with valid credentials
- ✅ Invalid credentials handling
- ✅ Registration form
- ✅ Email validation
- ✅ Protected route access
- ✅ Logout functionality

### Dashboard
- ✅ Tab navigation
- ✅ Log Trip form
- ✅ View Data table
- ✅ Plan Trip recommendations
- ✅ Reports display
- ✅ Predictions display
- ✅ Browse Locations
- ✅ Best Conditions

### Log Trip
- ✅ Form fields rendering
- ✅ Dropdown loading from API
- ✅ Bait filtering by fishing type
- ✅ Fish caught toggle
- ✅ Environmental data loading
- ✅ Form submission
- ✅ Custom submissions (Other option)

### Admin Panel
- ✅ Access control
- ✅ Overview statistics
- ✅ Review submissions
- ✅ Contact messages
- ✅ Dropdown management
- ✅ User management
- ✅ System logs

### API Endpoints
- ✅ Health check
- ✅ Public conditions
- ✅ Authentication
- ✅ Fishing logs CRUD
- ✅ Dropdown options
- ✅ Predictions
- ✅ Admin endpoints
- ✅ Error handling

## 🔄 CI/CD Integration

Tests run automatically on:
- Pull requests to any branch
- Pushes to `main` and `develop`

### GitHub Actions Workflow

The workflow (`.github/workflows/e2e-tests.yml`):
1. Sets up PostgreSQL database
2. Creates test users
3. Starts backend and frontend
4. Runs Playwright tests
5. Uploads HTML report as artifact
6. Posts results to PR comments
7. Cleans up test data

### Viewing Reports

After CI runs:
1. Go to Actions tab
2. Click on the workflow run
3. Download `playwright-report` artifact
4. Open `index.html` in browser

## 🧹 Cleanup

### Manual Cleanup
```bash
npm run cleanup
```

### Full Cleanup (including node_modules)
```bash
node scripts/cleanup.js --full
```

### Cleanup Playwright Browsers
```bash
node scripts/cleanup.js --browsers
```

## 📝 Writing Tests

### Using Fixtures
```javascript
const { test, expect } = require('../fixtures');

test('example test', async ({ page, apiHelper, testData }) => {
  // page - Playwright page object
  // apiHelper - API helper methods
  // testData - Test data generators
  
  await page.goto('/dashboard');
  const logData = testData.fishingLog();
  // ...
});
```

### Best Practices
1. Use descriptive test names
2. Group related tests in `test.describe`
3. Use fixtures for reusable logic
4. Clean up test data after tests
5. Use meaningful assertions
6. Handle async operations properly

## 🐛 Troubleshooting

### Tests failing on CI but passing locally
- Check environment variables
- Verify services are healthy before tests
- Check for timing issues

### Browser not installing
```bash
npx playwright install --with-deps
```

### Database connection issues
- Verify PostgreSQL is running
- Check connection credentials
- Ensure init.sql has run

### Timeout errors
- Increase timeout in config
- Check network conditions
- Verify services are responding

## 📄 License

Part of Fishing Tracker Pro - Mauritius Edition
