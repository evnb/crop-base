# Project Structure Notes

## Branch History

### crop-box-attempt1 (Historical)
- First attempt at implementing pixel-perfect photo editing
- Used cropperjs as a submodule in `lib/cropperjs/`
- Contained local commits with cropperjs modifications (not pushed to remote)
- Key modifications attempted:
  1. Enhanced pixel view mode rendering
  2. Modified canvas and crop box interactions
  3. Added view mode constants for image rendering
- Branch preserved for reference but no longer active

### custom-cropper (Historical)
- Fresh implementation without external dependencies
- Custom cropping solution from scratch
- Goals:
  1. Allow crop box to extend beyond visible area
  2. Maintain absolute pixel coordinates during zoom
  3. Separate view panning from crop box movement

### attempt2 (Current)
- TypeScript conversion with enhanced type safety
- Building from scratch with clean architecture
- Comprehensive test suite with Playwright
- Key focus areas:
  1. Type-safe implementation with interfaces
  2. End-to-end testing infrastructure
  3. Pixel-perfect crop box positioning and movement
  4. Clean separation between view panning and crop box controls

## Project Layout

```
PhotoEditWebApp/
├── src/                         # Source directory
│   ├── index.html              # Main HTML file
│   ├── script.ts               # Main TypeScript file
│   └── styles.css              # Global styles
├── dist/                       # Compiled TypeScript output
├── tests/                      # Test directory
│   └── editor.spec.ts          # Playwright tests
├── testimages/                 # Test images
├── node_modules/               # Dependencies
├── package.json                # Project configuration
├── tsconfig.json              # TypeScript configuration
├── DevProgress.md             # Development progress tracking
├── ProjectStructureNotes.md   # This file - Project structure
└── TestingGuide.md           # Testing documentation
```

## Implementation History

### First Attempt (crop-box-attempt1)
- Used cropperjs library as a submodule
- Attempted modifications to support pixel-perfect editing
- Challenges encountered:
  1. Crop box positioning tied to container rather than image
  2. Complex coordinate transformation system
  3. Difficulty extending crop box beyond visible area
  4. Tight coupling between panning and crop box movement

### Current Implementation (attempt2)
- TypeScript-based solution with comprehensive testing
- Key design principles:
  1. Type safety with interfaces and strict checks
  2. Separation of concerns between view and crop box
  3. Direct pixel coordinate management
  4. Clean architecture without external dependencies
  5. Comprehensive test coverage

## Development Environment
- TypeScript for type safety
- Playwright for end-to-end testing
- Python HTTP server for local development
- Multiple browser testing support

## Related Documentation
- [DevProgress.md](DevProgress.md) - Current development progress
- [TestingGuide.md](TestingGuide.md) - Testing procedures and setup
- Historical documentation archived in this file

## Git Operations Reference

### Branch Management
```powershell
# View current branch
git branch

# Switch to attempt2 branch
git checkout attempt2
```

Note: The cropperjs submodule has been removed from the project. Historical reference of the implementation attempt is preserved in the crop-box-attempt1 branch. 