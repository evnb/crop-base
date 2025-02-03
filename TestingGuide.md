# Testing Guide

## Overview
This document outlines the testing infrastructure and procedures for the PhotoEditWebApp project. We use Playwright for end-to-end testing across multiple browsers.

## Setup

### Prerequisites
- Node.js and npm installed
- Python 3.x (for local development server)
- Playwright Test dependencies

### Installation
1. Install project dependencies:
```powershell
npm install
```

2. Install Playwright browsers:
```powershell
npx playwright install
```

## Running Tests

### Development Server
Before running tests, start the Python development server:
```powershell
python -m http.server 8000
```

### Test Commands

1. Run all tests:
```powershell
npx playwright test
```

2. Run tests with UI mode (recommended for development):
```powershell
npx playwright test --ui
```

3. Run tests with debug output:
```powershell
npx playwright test --debug
```

4. Run tests with both UI and debug:
```powershell
npx playwright test --ui --debug
```

5. View test report:
```powershell
npx playwright show-report
```

6. Run tests with console output:
```powershell
npx playwright test --reporter=list
```

## Test Structure

### Test Files
- `tests/editor.spec.ts`: Main test suite for the photo editor
- Additional test files can be added in the `tests/` directory

### Test Categories
1. Initial State Tests
   - Verify proper loading of UI elements
   - Check initial visibility states
   - Validate default values

2. Image Upload Tests
   - Test file input functionality
   - Verify canvas setup
   - Check crop box initialization

3. Zoom Control Tests
   - Test zoom in/out buttons
   - Verify mouse wheel zoom
   - Check zoom level display

4. Panning Tests
   - Test image panning functionality
   - Verify coordinate updates
   - Check transform changes

5. Pixel-Perfect Tests
   - Verify coordinate precision
   - Check scaling behavior
   - Validate crop box measurements

## Test Environment

### Browsers
Tests run on multiple browsers:
- Chromium
- Firefox
- WebKit

### Test Data
- Test images are stored in `testimages/` directory
- Current test image: `lewis-fungi-31a2.jpg`

## Debugging Tests

### Common Issues
1. Connection Refused
   - Ensure Python server is running on port 8000
   - Check correct URL in tests

2. Element Not Found
   - Verify element IDs match between tests and HTML
   - Check element visibility states
   - Ensure proper wait conditions

3. Transform Issues
   - Check CSS transform properties
   - Verify pan/zoom calculations
   - Validate coordinate systems

### Debug Tools
1. UI Mode
   - Interactive test runner
   - Visual feedback
   - Step-by-step execution

2. Debug Mode
   - Detailed console output
   - Break on failures
   - Network information

3. Trace Viewer
   - Timeline of test execution
   - Screenshots at each step
   - Network requests

## Best Practices

1. Test Organization
   - Group related tests together
   - Use descriptive test names
   - Keep tests focused and atomic

2. Assertions
   - Use specific assertions
   - Check both positive and negative cases
   - Verify exact values when needed

3. Setup/Teardown
   - Use `beforeEach` for common setup
   - Clean up after tests
   - Isolate test environments

4. Wait Strategies
   - Wait for specific conditions
   - Use appropriate timeouts
   - Handle dynamic content properly

## Contributing

### Adding New Tests
1. Create test file in `tests/` directory
2. Follow existing test patterns
3. Include all relevant test categories
4. Add documentation for new test cases

### Updating Tests
1. Maintain backwards compatibility
2. Update related documentation
3. Verify across all browsers
4. Check both UI and headless modes

## Future Improvements
1. [ ] Add API mocking capabilities
2. [ ] Implement visual regression testing
3. [ ] Add performance benchmarks
4. [ ] Enhance error reporting
5. [ ] Add continuous integration setup 