# Publishing Guide

## Prerequisites

1. **Publisher Account**: Create a publisher account at [VS Code Marketplace](https://marketplace.visualstudio.com/manage)
2. **Personal Access Token**: Generate a PAT from Azure DevOps with "Marketplace: Manage" scope
3. **Icon**: Convert `media/icon.svg` to `media/icon.png` (128x128 pixels)

## Steps to Publish

1. **Install vsce** (if not already installed):
   ```bash
   npm install -g @vscode/vsce
   ```

2. **Update version** in `package.json`:
   ```json
   "version": "0.1.0"
   ```

3. **Update repository URLs** in `package.json`:
   - Replace `yourusername` with your actual GitHub username
   - Update repository, bugs, and homepage URLs

4. **Update publisher** in `package.json`:
   - Replace `rsvp-speed-reader` with your publisher ID

5. **Create icon.png**:
   - Open `media/icon.svg` in an image editor
   - Export as PNG at 128x128 pixels
   - Save as `media/icon.png`

6. **Compile the extension**:
   ```bash
   npm run compile
   ```

7. **Package the extension**:
   ```bash
   vsce package
   ```
   This creates a `.vsix` file.

8. **Test the package**:
   - Install the `.vsix` file locally to test
   - In VS Code: Extensions → ... → Install from VSIX

9. **Publish to Marketplace**:
   ```bash
   vsce publish
   ```
   You'll be prompted for your Personal Access Token.

## Version Management

- Use semantic versioning: `MAJOR.MINOR.PATCH`
- Update `CHANGELOG.md` with each release
- Tag releases in git: `git tag v0.1.0`

## Notes

- The extension requires `icon.png` (not SVG) for the marketplace
- All images in README/CHANGELOG must use HTTPS URLs
- Review VS Code Marketplace [publishing guidelines](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

