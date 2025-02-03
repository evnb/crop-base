# Information for New Agent

## Project Overview
- Building a pixel-perfect photo editor web app
- Main repo is private/local
- Starting fresh implementation (see [ProjectStructureNotes.md](ProjectStructureNotes.md) for history of attempts)

## Important Documents
1. [DevProgress.md](DevProgress.md) - Track development progress and current challenges
2. [ProjectStructureNotes.md](ProjectStructureNotes.md) - Project structure, branch organization, and implementation history
3. [TestingGuide.md](TestingGuide.md) - Comprehensive guide for testing setup, procedures, and best practices

## Project Structure
```
PhotoEditWebApp/
├── src/                         # Source directory
│   ├── index.html              # Main app interface
│   ├── script.ts               # App logic
│   └── styles.css              # App styling
├── tests/                      # Test directory
│   └── editor.spec.ts          # Playwright tests
└── dist/                       # Compiled output
```

## Reference Projects
[Example section - will be populated as we identify relevant projects]

## Current Status and Challenges
- See [DevProgress.md](DevProgress.md) for current status, goals, challenges, and next steps.
- See [TestingGuide.md](TestingGuide.md) for testing infrastructure and procedures.

## End Goal
- Create a mobile-friendly static-site webapp photo cropper. When a user adds a photo, the crop should be determined automatically based on an algorithm I will write.
- User should be allowed to edit the crop before it goes into effect
  - UI Editor that maintains exact pixel coordinates when cropping.
  - Allow users to pan around a large image while keeping crop box position fixed to the image
  - Enable crop box to extend beyond visible area
  - Ensure pixel-perfect precision in final cropped image
  - Ensure that if the image is scaled for a preview it will be in nearest neighbor to be pixel perfect, not a blurry mess.
