# Development Progress

## Goals
1. [ ] Allow crop box to extend beyond visible area
2. [x] Maintain absolute pixel coordinates during zoom
3. [x] Separate view panning from crop box movement

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

