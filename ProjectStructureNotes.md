# Project Structure Notes

## Branch Organization

### crop-box-attempt1
- First attempt at implementing pixel-perfect photo editing
- Contains cropperjs as a submodule in `lib/cropperjs/`
- Submodule contains local commits with our modifications (not pushed to remote)
- See [SubmoduleReadme.md](SubmoduleReadme.md) for details on cropperjs modifications

#### Accessing the Modified Submodule
After checking out the branch:
```powershell
git checkout crop-box-attempt1
git submodule update --init --recursive
```

#### Important Submodule Commits
The cropperjs submodule contains our local modifications in these commits:
1. 51f706b - "refactor: enhance pixel view mode rendering and CSS for crop box interactions"
2. c7abf0d - "feat: implement pixel view mode with enhanced canvas and crop box interactions"
3. 148194 - "feat: add view mode constants for image rendering"

### custom-cropper
- Fresh implementation attempt without using cropperjs
- Submodule has been removed intentionally
- Will contain our custom cropping solution

## Project Layout

```
PhotoEditWebApp/
├── lib/                          # Libraries
│   └── cropperjs/               # (Only in crop-box-attempt1 branch)
├── DevProgress.md               # Development progress tracking
├── SubmoduleReadme.md          # Cropperjs modification details
└── ProjectStructureNotes.md     # This file - Project structure documentation
```

## Important Notes
1. The cropperjs submodule and its modifications are preserved in the `crop-box-attempt1` branch
2. Switching between branches:
   - To `crop-box-attempt1`: Remember to run submodule update command
   - To `custom-cropper`: Clean implementation without submodule

## Related Documentation
- [DevProgress.md](DevProgress.md) - Detailed progress tracking
- [SubmoduleReadme.md](SubmoduleReadme.md) - Cropperjs modifications documentation 