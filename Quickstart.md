# Quickstart Guide

## Prerequisites
- Node.js and npm
- Python 3.x
- A modern web browser

## Initial Setup
1. Install dependencies:
```powershell
npm install
```

2. Install Playwright browsers (for testing):
```powershell
npx playwright install
```

## Development Workflow

### 1. Start TypeScript Compiler
Run in a terminal:
```powershell
npm run watch
```
This will watch for changes and compile TypeScript files automatically.

### 2. Start Development Server
In another terminal:
```powershell
python -m http.server 8000
```
This will serve the application at http://localhost:8000/src/index.html

### 3. Running Tests
In a third terminal:
```powershell
npm test           # Run all tests
npm run test:ui    # Run tests with UI
npm run test:debug # Run tests with debug mode
```

## Development Tips
- Keep both the TypeScript compiler and development server running during development
- The TypeScript compiler will automatically recompile when you save changes
- Refresh your browser to see the latest changes
- Check the browser console for any errors or warnings

## Common Issues
1. "Cannot find module" errors
   - Ensure TypeScript compiler is running
   - Check if all dependencies are installed

2. Connection refused errors
   - Verify Python server is running on port 8000
   - Check if another process is using port 8000

3. Test failures
   - Ensure both TypeScript compiler and server are running
   - Check browser console for errors
   - Use test:ui mode for debugging 