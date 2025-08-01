#!/bin/bash

# Edutrac Exams Module Test Runner
# This script runs all tests for the exams module and generates reports

echo "🧪 Starting Edutrac Exams Module Test Suite..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Check if Node.js and npm are installed
if ! command -v node &> /dev/null; then
    print_status $RED "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_status $RED "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_status $YELLOW "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_status $RED "❌ Failed to install dependencies"
        exit 1
    fi
fi

# Create test results directory
mkdir -p test-results

print_status $BLUE "🔍 Running Exams Module Tests..."

# Run tests with coverage
npm run test:exams -- --coverage --verbose --testResultsProcessor=jest-json-reporter 2>&1 | tee test-results/test-output.log

# Check if tests passed
if [ ${PIPESTATUS[0]} -eq 0 ]; then
    print_status $GREEN "✅ All tests passed!"
    
    # Generate summary report
    echo "📊 Generating test summary..."
    
    cat > test-results/summary.md << EOF
# Exams Module Test Summary

**Date:** $(date)
**Status:** ✅ PASSED

## Test Results

$(grep -E "(PASS|FAIL)" test-results/test-output.log | head -20)

## Coverage Summary

$(grep -A 10 "Coverage Summary" test-results/test-output.log || echo "Coverage data not found")

## Test Files Executed

- API Routes Tests
  - exams.test.ts
  - exam-scores.test.ts
- Component Tests  
  - create-exam.test.tsx
  - exam-list.test.tsx
- Utility Tests
  - exam-utils.test.ts
  - exam-score-calculator.test.ts
- Integration Tests
  - exam-workflow.test.ts

## Next Steps

✅ Exams module testing complete
⏳ Ready to move to Finance module testing
⏳ Ready to move to Attendance module testing
⏳ Ready to move to Timetable module testing
⏳ Ready to move to Student management testing
⏳ Ready to move to Teacher management testing
⏳ Ready to move to Reports module testing

EOF

    print_status $GREEN "📄 Test summary generated: test-results/summary.md"
    
    # Check if coverage meets requirements
    if grep -q "All files.*90" test-results/test-output.log; then
        print_status $GREEN "🎯 Coverage requirements met (90%+)"
    else
        print_status $YELLOW "⚠️  Coverage may be below requirements. Check detailed report."
    fi
    
else
    print_status $RED "❌ Some tests failed!"
    
    # Generate failure report
    cat > test-results/failure-summary.md << EOF
# Exams Module Test Failure Summary

**Date:** $(date)
**Status:** ❌ FAILED

## Failed Tests

$(grep -E "(FAIL|Error)" test-results/test-output.log)

## Debugging Steps

1. Check individual test files for specific failures
2. Verify mock configurations are correct
3. Ensure all dependencies are properly installed
4. Check for any async/await issues in tests

## Common Issues

- Mock function not properly reset between tests
- Async operations not properly awaited
- Database mock chain incomplete
- Component props not properly mocked

EOF

    print_status $RED "📄 Failure summary generated: test-results/failure-summary.md"
    exit 1
fi

# If coverage directory exists, inform user
if [ -d "coverage" ]; then
    print_status $BLUE "📈 Coverage report available at: coverage/lcov-report/index.html"
    print_status $BLUE "   Open this file in your browser to view detailed coverage"
fi

print_status $GREEN "🎉 Exams module testing completed successfully!"
print_status $BLUE "📋 Test results saved in test-results/ directory"

echo ""
echo "Next steps:"
echo "1. Review coverage report if needed"
echo "2. Proceed with testing other modules (finance, attendance, etc.)"
echo "3. Set up CI/CD pipeline with these tests"
echo ""
