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
- Second fresh implementation focusing on pixel-perfect precision
- Building from scratch with clean architecture
- Key focus areas:
  1. Pixel-perfect crop box positioning and movement
  2. Clean separation between view panning and crop box controls
  3. Support for crop box extending beyond visible area
  4. Precise pixel coordinate management during zoom operations

## Project Layout

```
PhotoEditWebApp/
├── lib/                          # Libraries and custom components
├── index.html                    # Main HTML file
├── styles.css                    # Global styles
├── script.js                     # Main JavaScript file
├── DevProgress.md               # Development progress tracking
└── ProjectStructureNotes.md     # This file - Project structure documentation
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

### Current Implementation (custom-cropper)
- Fresh start with custom solution
- Key design principles:
  1. Separation of concerns between view and crop box
  2. Direct pixel coordinate management
  3. Unrestricted crop box movement
  4. Clean architecture without external dependencies

## Related Documentation
- [DevProgress.md](DevProgress.md) - Current development progress
- Historical documentation has been archived in this file

## Git Operations Reference

### Branch Management
```powershell
# View current branch
git branch

# Switch to custom-cropper branch
git checkout custom-cropper
```

Note: The cropperjs submodule has been removed from the project. Historical reference of the implementation attempt is preserved in the crop-box-attempt1 branch. 