# E2E Test Runner for Windows PowerShell
# Fishing Tracker Pro - Comprehensive End-to-End Testing

param(
    [switch]$Docker,
    [switch]$Headed,
    [switch]$Debug,
    [switch]$Cleanup,
    [switch]$Report,
    [string]$Project = "",
    [switch]$Help
)

$ErrorActionPreference = "Stop"

# Colors
function Write-Step { Write-Host "► $args" -ForegroundColor Yellow }
function Write-Success { Write-Host "✓ $args" -ForegroundColor Green }
function Write-Error { Write-Host "✗ $args" -ForegroundColor Red }

Write-Host "============================================" -ForegroundColor Blue
Write-Host "  Fishing Tracker Pro - E2E Test Runner    " -ForegroundColor Blue
Write-Host "============================================" -ForegroundColor Blue
Write-Host ""

# Help
if ($Help) {
    Write-Host "Usage: .\run-tests.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Docker     Run tests in Docker containers"
    Write-Host "  -Headed     Run tests with browser visible"
    Write-Host "  -Debug      Run tests in debug mode"
    Write-Host "  -Cleanup    Only run cleanup (no tests)"
    Write-Host "  -Report     Generate HTML report after tests"
    Write-Host "  -Project    Run specific project (chromium, firefox, mobile-chrome, admin-tests)"
    Write-Host "  -Help       Show this help message"
    exit 0
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$E2EDir = Split-Path -Parent $ScriptDir

# Cleanup only
if ($Cleanup) {
    Write-Step "Running cleanup..."
    Set-Location $E2EDir
    node scripts/cleanup.js
    Write-Success "Cleanup completed"
    exit 0
}

# Check Node.js
Write-Step "Checking dependencies..."
try {
    node --version | Out-Null
    npm --version | Out-Null
    Write-Success "Node.js and npm available"
} catch {
    Write-Error "Node.js is not installed"
    exit 1
}

# Install dependencies
if (-not (Test-Path "$E2EDir\node_modules")) {
    Write-Step "Installing E2E dependencies..."
    Set-Location $E2EDir
    npm install
    Write-Success "Dependencies installed"
}

# Install Playwright browsers
$playwrightCache = "$env:USERPROFILE\.cache\ms-playwright"
if (-not (Test-Path $playwrightCache)) {
    Write-Step "Installing Playwright browsers..."
    Set-Location $E2EDir
    npx playwright install --with-deps chromium firefox
    Write-Success "Browsers installed"
}

# Run tests
Set-Location $E2EDir

if ($Docker) {
    Write-Step "Starting Docker test environment..."
    docker-compose -f docker-compose.test.yml up -d test-postgres test-backend test-frontend
    
    Write-Step "Waiting for services..."
    Start-Sleep -Seconds 30
    
    Write-Step "Running tests in Docker..."
    docker-compose -f docker-compose.test.yml run --rm playwright
    
    $TestExitCode = $LASTEXITCODE
    
    Write-Step "Stopping Docker environment..."
    docker-compose -f docker-compose.test.yml down
} else {
    Write-Step "Running tests locally..."
    
    $TestCmd = "npx playwright test"
    
    if ($Project) {
        $TestCmd += " --project=$Project"
    }
    
    if ($Headed) {
        $TestCmd += " --headed"
    }
    
    if ($Debug) {
        $TestCmd += " --debug"
    }
    
    Write-Host "Executing: $TestCmd"
    Invoke-Expression $TestCmd
    
    $TestExitCode = $LASTEXITCODE
}

# Generate report
if ($Report) {
    Write-Step "Generating HTML report..."
    node scripts/generate-report.js
    Write-Success "Report generated: test-results/report.html"
}

# Summary
Write-Host ""
Write-Host "============================================" -ForegroundColor Blue
if ($TestExitCode -eq 0) {
    Write-Success "All tests completed successfully!"
} else {
    Write-Error "Some tests failed (exit code: $TestExitCode)"
}
Write-Host "============================================" -ForegroundColor Blue

if (Test-Path "playwright-report\index.html") {
    Write-Host ""
    Write-Host "View the test report:"
    Write-Host "  npx playwright show-report"
}

exit $TestExitCode
