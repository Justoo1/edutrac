# Edutrac Testing Suite - Exams Module

This document provides comprehensive information about the testing infrastructure for the Edutrac Exams Module.

## Overview

The testing suite covers all aspects of the exams module including:
- API route testing
- Component testing
- Utility function testing
- Integration testing
- Service layer testing

## Testing Stack

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **Jest DOM**: Custom Jest matchers for DOM elements
- **Node Mocks HTTP**: HTTP request/response mocking
- **User Event**: User interaction simulation

## Test Structure

```
__tests__/
└── exams/
    ├── api/                    # API route tests
    │   ├── exams.test.ts
    │   └── exam-scores.test.ts
    ├── components/             # Component tests
    │   ├── create-exam.test.tsx
    │   └── exam-list.test.tsx
    ├── utils/                  # Utility function tests
    │   ├── exam-utils.test.ts
    │   └── exam-score-calculator.test.ts
    └── integration/            # Integration tests
        └── exam-workflow.test.ts
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Exams Module Only
```bash
npm run test:exams
```

### CI Mode
```bash
npm run test:ci
```

## Test Categories

### 1. API Route Tests (`__tests__/exams/api/`)

**File: `exams.test.ts`**
- Tests exam creation (POST /api/exams)
- Tests exam listing (GET /api/exams)
- Covers different school types (BASIC vs SHS)
- Error handling and validation
- Authentication checks

**File: `exam-scores.test.ts`**
- Tests score updates (POST /api/exams/update-scores)
- Tests score retrieval (GET /api/exams/update-scores)
- Score validation and error handling
- Concurrent updates handling

### 2. Component Tests (`__tests__/exams/components/`)

**File: `create-exam.test.tsx`**
- Form rendering and field validation
- User input handling
- Form submission (success/error scenarios)
- Loading states and error messages
- Navigation after successful creation

**File: `exam-list.test.tsx`**
- Exam list rendering
- Search and filtering functionality
- Status badges and action buttons
- Empty states and error handling
- API integration

### 3. Utility Tests (`__tests__/exams/utils/`)

**File: `exam-utils.test.ts`**
- Score conversion functions
- Final score calculations
- Continuous assessment combinations
- Ghanaian grading system
- Class statistics calculations
- Student position calculations

**File: `exam-score-calculator.test.ts`**
- Exam score calculations
- Grade validation and ranges
- Score conversion with different percentages
- Term report generation
- Error handling in calculations

### 4. Integration Tests (`__tests__/exams/integration/`)

**File: `exam-workflow.test.ts`**
- Complete exam lifecycle testing
- Multi-step workflows (create → conduct → grade → report)
- Data consistency across operations
- Concurrent operations handling
- Error recovery scenarios

## Test Patterns and Best Practices

### 1. Mocking Strategy

```typescript
// Mock external dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/db');
jest.mock('next/navigation');
jest.mock('next-auth/react');
```

### 2. Setup and Teardown

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  // Reset mock implementations
});
```

### 3. API Testing Pattern

```typescript
import { createMocks } from 'node-mocks-http';

const { req } = createMocks({
  method: 'POST',
  body: testData,
});

const response = await apiHandler(req);
const result = await response.json();
```

### 4. Component Testing Pattern

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();
render(<Component />);

await user.type(screen.getByLabelText('Field'), 'value');
await user.click(screen.getByRole('button'));

await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

## Coverage Requirements

The test suite aims for:
- **90%+ line coverage** for API routes and utilities
- **85%+ line coverage** for components
- **80%+ line coverage** for integration scenarios

## Mock Data Patterns

### Common Mock Objects

```typescript
const mockSession = {
  user: {
    id: 'user-123',
    schoolId: 'school-123',
    email: 'teacher@school.com'
  }
};

const mockExam = {
  id: 'exam-123',
  name: 'Mathematics Test 1',
  status: 'scheduled',
  totalMarks: 100,
  // ... other properties
};
```

### Database Mocking

```typescript
mockDb.query.exams.findMany.mockResolvedValue([mockExam]);
mockDb.insert.mockReturnValue({
  values: jest.fn().mockReturnValue({
    returning: jest.fn().mockResolvedValue([mockExam])
  })
});
```

## Error Scenarios Tested

1. **Authentication Failures**
   - Unauthenticated requests
   - Invalid session data

2. **Validation Errors**
   - Missing required fields
   - Invalid score ranges
   - Duplicate exam creation

3. **Database Errors**
   - Connection failures
   - Constraint violations
   - Transaction failures

4. **Business Logic Errors**
   - Invalid grade calculations
   - Inconsistent academic periods
   - Student enrollment issues

## Performance Testing

### Load Testing Scenarios
- Concurrent exam creation
- Bulk score updates
- Large class report generation

### Memory Testing
- Large dataset processing
- Long-running calculations
- Resource cleanup validation

## Test Data Management

### Test Fixtures
Located in `__tests__/fixtures/` (when needed):
- Sample exam data
- Mock student records
- Academic year configurations

### Data Cleanup
Tests are designed to be isolated and don't require cleanup between runs due to comprehensive mocking.

## Debugging Tests

### Common Issues and Solutions

1. **Async Test Failures**
   ```typescript
   // Use waitFor for async operations
   await waitFor(() => {
     expect(screen.getByText('Result')).toBeInTheDocument();
   });
   ```

2. **Mock Function Issues**
   ```typescript
   // Clear mocks between tests
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

3. **Database Mock Problems**
   ```typescript
   // Ensure proper mock chain
   mockDb.query.table.method.mockResolvedValue(data);
   ```

## Continuous Integration

### GitHub Actions Configuration
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
```

### Test Reporting
- Jest generates coverage reports in `coverage/` directory
- HTML reports available at `coverage/lcov-report/index.html`
- CI/CD integration with coverage thresholds

## Future Test Enhancements

### Planned Additions
1. **End-to-End Testing** with Playwright
2. **Visual Regression Testing** for UI components
3. **API Contract Testing** with Pact.js
4. **Performance Benchmarking** with automated alerts
5. **Accessibility Testing** with jest-axe

### Test Expansion for Other Modules
After completing the exams module testing, similar test suites will be created for:
- Finance Module
- Attendance Module
- Timetable Module
- Student Management
- Teacher Management
- Reports Module

## Contributing to Tests

### Writing New Tests
1. Follow the established patterns
2. Use descriptive test names
3. Include both positive and negative scenarios
4. Mock external dependencies appropriately
5. Ensure tests are isolated and repeatable

### Test Review Checklist
- [ ] Tests cover both happy path and error scenarios
- [ ] All external dependencies are properly mocked
- [ ] Test names clearly describe what is being tested
- [ ] No hardcoded values that could break in different environments
- [ ] Proper cleanup and setup in test lifecycle hooks
- [ ] Adequate assertions without over-testing implementation details

## Troubleshooting

### Common Test Failures

**1. "ReferenceError: fetch is not defined"**
- Solution: Ensure global fetch mock is set up in jest.setup.js

**2. "Cannot read property of undefined" in database mocks**
- Solution: Check mock chain structure and ensure all nested properties are mocked

**3. "act() warning in React components"**
- Solution: Use waitFor() for async operations and user interactions

**4. "Test timeout errors"**
- Solution: Increase timeout or check for infinite loops in async operations

### Performance Issues
- Use `jest --detectSlowTests` to identify slow tests
- Mock heavy computations and external API calls
- Consider test parallelization for large suites

## Metrics and Reporting

### Key Metrics Tracked
- Test coverage percentage
- Test execution time
- Flaky test identification
- Code quality metrics

### Reports Generated
- Coverage reports (HTML, LCOV)
- Test execution reports
- Performance benchmarks
- Error analysis reports

---

This comprehensive testing framework ensures the reliability and maintainability of the Edutrac exams module while providing a solid foundation for testing other modules in the system.
