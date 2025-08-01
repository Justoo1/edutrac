@echo off
REM Edutrac Exams Module Test Runner (Windows)
REM This script runs all tests for the exams module and generates reports

echo 🧪 Starting Edutrac Exams Module Test Suite...
echo ==================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Create test results directory
if not exist "test-results" mkdir test-results

echo 🔍 Running Exams Module Tests...

REM Run tests with coverage
npm run test:exams -- --coverage --verbose > test-results\test-output.log 2>&1

if errorlevel 1 (
    echo ❌ Some tests failed!
    echo 📄 Check test-results\test-output.log for details
    
    REM Generate failure summary
    echo # Exams Module Test Failure Summary > test-results\failure-summary.md
    echo. >> test-results\failure-summary.md
    echo **Date:** %date% %time% >> test-results\failure-summary.md
    echo **Status:** ❌ FAILED >> test-results\failure-summary.md
    echo. >> test-results\failure-summary.md
    echo ## Next Steps >> test-results\failure-summary.md
    echo. >> test-results\failure-summary.md
    echo 1. Check test-results\test-output.log for detailed error messages >> test-results\failure-summary.md
    echo 2. Verify mock configurations are correct >> test-results\failure-summary.md
    echo 3. Ensure all dependencies are properly installed >> test-results\failure-summary.md
    echo 4. Check for any async/await issues in tests >> test-results\failure-summary.md
    
    pause
    exit /b 1
) else (
    echo ✅ All tests passed!
    
    REM Generate success summary
    echo # Exams Module Test Summary > test-results\summary.md
    echo. >> test-results\summary.md
    echo **Date:** %date% %time% >> test-results\summary.md
    echo **Status:** ✅ PASSED >> test-results\summary.md
    echo. >> test-results\summary.md
    echo ## Test Files Executed >> test-results\summary.md
    echo. >> test-results\summary.md
    echo - API Routes Tests >> test-results\summary.md
    echo   - exams.test.ts >> test-results\summary.md
    echo   - exam-scores.test.ts >> test-results\summary.md
    echo - Component Tests >> test-results\summary.md
    echo   - create-exam.test.tsx >> test-results\summary.md
    echo   - exam-list.test.tsx >> test-results\summary.md
    echo - Utility Tests >> test-results\summary.md
    echo   - exam-utils.test.ts >> test-results\summary.md
    echo   - exam-score-calculator.test.ts >> test-results\summary.md
    echo - Integration Tests >> test-results\summary.md
    echo   - exam-workflow.test.ts >> test-results\summary.md
    echo. >> test-results\summary.md
    echo ## Next Steps >> test-results\summary.md
    echo. >> test-results\summary.md
    echo ✅ Exams module testing complete >> test-results\summary.md
    echo ⏳ Ready to move to Finance module testing >> test-results\summary.md
    echo ⏳ Ready to move to Attendance module testing >> test-results\summary.md
    echo ⏳ Ready to move to Timetable module testing >> test-results\summary.md
    echo ⏳ Ready to move to Student management testing >> test-results\summary.md
    echo ⏳ Ready to move to Teacher management testing >> test-results\summary.md
    echo ⏳ Ready to move to Reports module testing >> test-results\summary.md
    
    echo 📄 Test summary generated: test-results\summary.md
)

REM Check if coverage directory exists
if exist "coverage" (
    echo 📈 Coverage report available at: coverage\lcov-report\index.html
    echo    Open this file in your browser to view detailed coverage
)

echo 🎉 Exams module testing completed!
echo 📋 Test results saved in test-results\ directory
echo.
echo Next steps:
echo 1. Review coverage report if needed
echo 2. Proceed with testing other modules (finance, attendance, etc.^)
echo 3. Set up CI/CD pipeline with these tests
echo.

pause
