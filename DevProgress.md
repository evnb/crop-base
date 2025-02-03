# Development Progress

## Goals
1. [ ] Allow crop box to extend beyond visible area
2. [x] Maintain absolute pixel coordinates during zoom
3. [x] Separate view panning from crop box movement

## Crop Box Behavior Investigation (VIEW_MODE_PIXEL)

### Initial Problem
The crop box doesn't follow the image when panning, and zooming out is restricted unless the crop box touches the edges of the view window or is adjusted.

### Attempted Solutions

1. **Modifying Crop Box Constraints**
   - Changed `limitCropBox` method to remove size constraints in VIEW_MODE_PIXEL
   - Set minimum dimensions to 1x1 pixels
   - Set maximum dimensions and positions to Infinity
   - Outcome: Partially successful - removed size constraints but didn't fix panning behavior

2. **Canvas Limitations**
   - Modified `limitCanvas` method to remove constraints in VIEW_MODE_PIXEL
   - Set canvas boundaries to Infinity
   - Allowed canvas to move freely
   - Outcome: Helped with zooming but didn't resolve crop box attachment to image

3. **DOM Structure Changes**
   - Moved crop box to be direct child of container instead of canvas
   - Updated template.js to reflect new structure
   - Outcome: Did not resolve the fundamental issue of crop box not following image

4. **CSS Modifications**
   - Added z-index to ensure proper layering
   - Modified overflow behaviors
   - Added pointer-events handling for visibility
   - Added clipping behavior for overflow areas
   - Outcome: Improved visual behavior but didn't fix core positioning issue

### Key Insights
1. The issue seems to be more fundamental than just constraints - it's about how the crop box is positioned relative to the image
2. The current architecture ties the crop box position to the container rather than the image/canvas
3. The VIEW_MODE_PIXEL mode requires different handling than other view modes
4. Simply removing constraints or changing the DOM structure isn't sufficient

### Current State
- Crop box can extend beyond boundaries
- Size constraints are removed in pixel mode
- Canvas can move freely
- But core issue persists: crop box doesn't maintain proper relationship with image during panning

### Potential Next Steps
1. Complete rewrite of the positioning system to make crop box a true "child" of the image
2. Investigation of the coordinate transformation system between container, canvas, and crop box
3. Consider implementing a different approach to crop box positioning entirely

### Files Modified
- lib/cropperjs/src/js/render.js
- lib/cropperjs/src/css/cropper.css
- lib/cropperjs/src/js/template.js

### Related Components
- Crop Box Positioning System
- Canvas Movement Logic
- View Mode Handling
- DOM Structure
- CSS Layout and Visibility

## Implementation Notes

### Goal 1: Extend Beyond Visible Area
- Modified `render.js` limitCropBox to remove constraints in VIEW_MODE_PIXEL
- Still not working - crop box remains constrained
- Need to investigate:
  - Where are the constraints being enforced?
  - Is `limitCropBox` being called correctly?
  - Are there other methods enforcing boundaries?

### Goal 2: Maintain Pixel Coordinates ✓
- Modified `methods.js` zoomTo to preserve relative crop box position
- Working as expected

### Goal 3: Separate Pan/Move ✓
- Modified `handlers.js` cropStart to detect click location
- Inside crop box -> move crop box
- Outside crop box -> pan view
- Working as expected

## Current Challenge
The crop box is still constrained despite removing constraints in limitCropBox method. Need to investigate where else constraints might be enforced. 

## Next Steps
1. Debug why crop box still can't extend beyond visible area
   - Add logging to track when/where constraints are applied
   - Review all methods that modify crop box position/size

