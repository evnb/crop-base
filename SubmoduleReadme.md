# Git Submodules Guide

## What are Git Submodules?

Git submodules allow you to keep a Git repository as a subdirectory of another Git repository. They let you clone another repository into your project and keep your commits separate.

### Key Concepts

- A submodule is a repository embedded inside another repository
- The main repository tracks the submodule's specific commit
- Submodules don't track branches, only commits
- Changes to the submodule are tracked separately from the main project

## Common Submodule Commands

### Adding a Submodule
```
git submodule add <repository-url> <path>
```

### Cloning a Project with Submodules
```
# Clone main project and submodules in one command
git clone --recurse-submodules <main-project-url>

# Or, if already cloned:
git submodule init
git submodule update
```

### Updating Submodules
```
# Update all submodules to their latest commits
git submodule update --remote

# Update specific submodule
git submodule update --remote lib/cropperjs
```

## Our Implementation

### Project Structure
```
image-editor/           # Main project
├── lib/
│   └── cropperjs/      # Submodule
├── index.html
├── styles.css
├── script.js
└── SubmoduleReadme.md
```

### Setup Steps

1. Initialize submodule:
```
git submodule add https://github.com/evnb/cropperjs.git lib/cropperjs
```

2. Switch to specific commit/tag:
```
cd lib/cropperjs
git checkout <commit-or-tag>
cd ../..
```

3. Commit the submodule addition:
```
git add .gitmodules lib/cropperjs
git commit -m "Add cropperjs as submodule"
```

### Working with Our Submodule

1. Making changes to cropperjs:
```
cd lib/cropperjs
# Make changes
git commit -am "Your changes"
git push
cd ../..
```

2. Update main project to use new submodule commit:
```
git add lib/cropperjs
git commit -m "Update cropperjs submodule"
```

### Important Notes

- Always commit submodule changes before main project changes
- The main project tracks which commit of the submodule to use
- Other developers need to run `git submodule update --init` after cloning
- Use `git status` to check if submodules have been modified

## Common Issues

### Submodule appears as 'dirty' in status:
```
git submodule foreach git reset --hard
```

### Submodule at wrong commit:
```
git submodule update --init --recursive
```

### Accidentally committed wrong submodule state:
```
git submodule update --init
cd lib/cropperjs
git checkout desired-commit
cd ../..
git add lib/cropperjs
git commit -m "Fix submodule commit"
``` 