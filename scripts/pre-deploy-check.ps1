# ====================================
# Pre-Deployment Check Script (PowerShell)
# AI Video Poster Pro - Thai Edition
# ====================================

$ErrorActionPreference = "Stop"

# Counters
$script:PASSED = 0
$script:FAILED = 0
$script:WARNINGS = 0

# Helper functions
function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host "  $Message" -ForegroundColor Blue
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
    $script:PASSED++
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
    $script:FAILED++
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
    $script:WARNINGS++
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

# Start
Write-Host ""
Write-Host "  ╔═══════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "  ║   🚀 Pre-Deployment Checks                        ║" -ForegroundColor Blue
Write-Host "  ║   AI Video Poster Pro - Thai Edition              ║" -ForegroundColor Blue
Write-Host "  ╚═══════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# ====================================
# 1. Check Node Version
# ====================================
Write-Header "1. Checking Node.js Version"

try {
    $nodeVersion = node -v
    $nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    
    if ($nodeMajor -ge 20) {
        Write-Success "Node.js version: $nodeVersion (required: >= 20)"
    } else {
        Write-Error-Custom "Node.js version $nodeVersion is too old. Required: >= 20"
        exit 1
    }
} catch {
    Write-Error-Custom "Node.js is not installed!"
    exit 1
}

# ====================================
# 2. Check npm Version
# ====================================
Write-Header "2. Checking npm Version"

try {
    $npmVersion = npm -v
    Write-Success "npm version: $npmVersion"
} catch {
    Write-Error-Custom "npm is not installed!"
    exit 1
}

# ====================================
# 3. Install Dependencies
# ====================================
Write-Header "3. Installing Dependencies"

if (Test-Path "package-lock.json") {
    Write-Info "Using npm ci for clean install..."
    try {
        npm ci 2>&1 | Out-Null
        Write-Success "Dependencies installed successfully"
    } catch {
        Write-Error-Custom "Failed to install dependencies"
        exit 1
    }
} else {
    Write-Info "No package-lock.json found, using npm install..."
    try {
        npm install 2>&1 | Out-Null
        Write-Success "Dependencies installed successfully"
    } catch {
        Write-Error-Custom "Failed to install dependencies"
        exit 1
    }
}

# ====================================
# 4. Check Environment Variables
# ====================================
Write-Header "4. Checking Environment Variables"

$requiredVars = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL"
)

$optionalVars = @(
    "TIKTOK_CLIENT_KEY",
    "TIKTOK_CLIENT_SECRET",
    "FACEBOOK_APP_ID",
    "FACEBOOK_APP_SECRET",
    "GEMINI_API_KEY",
    "CRON_SECRET"
)

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Success ".env.local file exists"
    # Load environment variables
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
} else {
    Write-Warning-Custom ".env.local file not found"
}

# Check required variables
foreach ($var in $requiredVars) {
    $value = [Environment]::GetEnvironmentVariable($var, "Process")
    if ($value) {
        Write-Success "$var is set"
    } else {
        Write-Error-Custom "$var is NOT set (required)"
    }
}

# Check optional variables
foreach ($var in $optionalVars) {
    $value = [Environment]::GetEnvironmentVariable($var, "Process")
    if ($value) {
        Write-Success "$var is set"
    } else {
        Write-Warning-Custom "$var is not set (optional)"
    }
}

# ====================================
# 5. Run Linter
# ====================================
Write-Header "5. Running ESLint"

try {
    $lintOutput = npm run lint 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Linting passed - no errors"
    } else {
        Write-Error-Custom "Linting failed!"
        Write-Host $lintOutput
        exit 1
    }
} catch {
    Write-Error-Custom "Linting failed!"
    exit 1
}

# ====================================
# 6. Run Type Check
# ====================================
Write-Header "6. Running TypeScript Type Check"

try {
    $typeOutput = npm run type-check 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Type check passed - no errors"
    } else {
        Write-Error-Custom "Type check failed!"
        Write-Host $typeOutput
        exit 1
    }
} catch {
    Write-Error-Custom "Type check failed!"
    exit 1
}

# ====================================
# 7. Run Tests
# ====================================
Write-Header "7. Running Tests"

try {
    $testOutput = npm test 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "All tests passed"
    } else {
        Write-Error-Custom "Tests failed!"
        Write-Host $testOutput
        exit 1
    }
} catch {
    Write-Error-Custom "Tests failed!"
    exit 1
}

# ====================================
# 8. Build Project
# ====================================
Write-Header "8. Building Project"

try {
    $buildOutput = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Build completed successfully"
    } else {
        Write-Error-Custom "Build failed!"
        Write-Host $buildOutput
        exit 1
    }
} catch {
    Write-Error-Custom "Build failed!"
    exit 1
}

# ====================================
# 9. Check Bundle Size
# ====================================
Write-Header "9. Checking Bundle Size"

if (Test-Path ".next") {
    $bundleSize = (Get-ChildItem -Recurse ".next" | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Info ("Total .next folder size: {0:N2} MB" -f $bundleSize)
    Write-Success "Bundle size check completed"
} else {
    Write-Error-Custom ".next folder not found - build may have failed"
}

# ====================================
# 10. Check for Common Issues
# ====================================
Write-Header "10. Checking for Common Issues"

# Check for console.log in production code
$consoleLogs = (Get-ChildItem -Recurse -Include "*.ts","*.tsx" -Path "app","components","lib" -ErrorAction SilentlyContinue | 
    Select-String -Pattern "console\.log" -ErrorAction SilentlyContinue | 
    Where-Object { $_.Line -notmatch "^\s*//" }).Count

if ($consoleLogs -gt 0) {
    Write-Warning-Custom "Found $consoleLogs console.log statements (consider removing for production)"
} else {
    Write-Success "No console.log statements found"
}

# Check for TODO/FIXME comments
$todos = (Get-ChildItem -Recurse -Include "*.ts","*.tsx" -Path "app","components","lib" -ErrorAction SilentlyContinue | 
    Select-String -Pattern "TODO|FIXME" -ErrorAction SilentlyContinue).Count

if ($todos -gt 0) {
    Write-Warning-Custom "Found $todos TODO/FIXME comments"
} else {
    Write-Success "No TODO/FIXME comments found"
}

# Check for hardcoded localhost
$localhost = (Get-ChildItem -Recurse -Include "*.ts","*.tsx" -Path "app","components","lib" -ErrorAction SilentlyContinue | 
    Select-String -Pattern "localhost" -ErrorAction SilentlyContinue | 
    Where-Object { $_.Line -notmatch "^\s*//" }).Count

if ($localhost -gt 0) {
    Write-Warning-Custom "Found $localhost references to localhost"
} else {
    Write-Success "No hardcoded localhost references"
}

# Check for .env files in git
$envInGit = git ls-files 2>$null | Where-Object { $_ -match "^\.env$|^\.env\.local$" }
if ($envInGit) {
    Write-Error-Custom ".env file is tracked in git! Remove it immediately!"
} else {
    Write-Success ".env files are not tracked in git"
}

# ====================================
# Summary
# ====================================
Write-Header "Summary"

Write-Host ""
Write-Host "  ✅ Passed:   $($script:PASSED)" -ForegroundColor Green
Write-Host "  ⚠️  Warnings: $($script:WARNINGS)" -ForegroundColor Yellow
Write-Host "  ❌ Failed:   $($script:FAILED)" -ForegroundColor Red
Write-Host ""

if ($script:FAILED -gt 0) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    Write-Host "  ❌ PRE-DEPLOYMENT CHECKS FAILED                  " -ForegroundColor Red
    Write-Host "  Please fix the errors above before deploying.    " -ForegroundColor Red
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    exit 1
} elseif ($script:WARNINGS -gt 0) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host "  ⚠️  PRE-DEPLOYMENT CHECKS PASSED WITH WARNINGS  " -ForegroundColor Yellow
    Write-Host "  Consider fixing warnings before deploying.      " -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  🚀 Ready to deploy (with warnings)" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Deploy commands:"
    Write-Host "    Preview:    vercel"
    Write-Host "    Production: vercel --prod"
    exit 0
} else {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "  ✅ ALL PRE-DEPLOYMENT CHECKS PASSED!            " -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    Write-Host "  🚀 Ready to deploy!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Deploy commands:"
    Write-Host "    Preview:    vercel"
    Write-Host "    Production: vercel --prod"
    exit 0
}
