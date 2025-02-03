# Information for New Agent

## Project Overview
- Building a pixel-perfect photo editor web app
- Main repo is private/local
- Using cropperjs fork as submodule (see [SubmoduleReadme.md](SubmoduleReadme.md) for details)

## Project Structure
```
photo-editor/
├── lib/
│   └── cropperjs/     # Our forked submodule
├── index.html         # Main app interface
├── script.js         # App logic
├── styles.css        # App styling
└── SubmoduleReadme.md # Git submodule documentation
```

## Reference Projects
- [fengyuanchen/photo-editor](https://github.com/fengyuanchen/photo-editor) - Example project using cropperjs
- Shows how cropperjs can be integrated into a full photo editing application
 
## Current Status and Challenges
- See [DevProgress.md](DevProgress.md) for current status, goals,challenges, and next steps.

## End Goal
- Create a photo editor that maintains exact pixel coordinates when cropping
- Allow users to pan around a large image while keeping crop box position fixed
- Enable crop box to extend beyond visible area (current challenge)
- Ensure pixel-perfect precision in final cropped image
