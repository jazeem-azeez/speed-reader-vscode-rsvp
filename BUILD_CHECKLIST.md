# Build and Run Checklist

## Pre-Build Verification

### ✅ Fixed Issues

1. **Configuration Listener**: Fixed to get fresh config on change (was using stale reference)
2. **Unused Import**: Removed unused `path` import from rsvpController
3. **epubjs Import**: Updated to use dynamic import with proper CommonJS handling

### ⚠️ Potential Issues to Verify

1. **epubjs Library Compatibility**
   - epubjs version 0.3.88 may have API differences
   - Test with actual EPUB files to verify text extraction works
   - May need to adjust API calls based on library version

2. **HTML Template Substitution**
   - Template uses `${variable}` syntax
   - Replacement uses `.replace()` which should work
   - Verify all placeholders are replaced correctly

3. **File Path Handling**
   - PDF/EPUB files may not have `fsPath` when opened from workspace
   - Verify `document.uri.fsPath` works for all file types
   - May need `vscode.workspace.fs.readFile()` for some cases

4. **Async/Await in epubjs**
   - epubjs API may differ from expected
   - Test with real EPUB files
   - May need error handling adjustments

## Build Steps

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Compile TypeScript**:

   ```bash
   npm run compile
   ```

3. **Check for Errors**:
   - Review compilation output
   - Fix any TypeScript errors
   - Verify all imports resolve

4. **Test in VS Code**:
   - Press F5 to launch Extension Development Host
   - Test with markdown file first (simplest case)
   - Then test with PDF/EPUB files

## Known Limitations

1. **Icon**: `media/icon.png` needs to be created from `media/icon.svg` (128x128 PNG)
2. **Repository URLs**: Update in `package.json` before publishing
3. **Publisher ID**: Update in `package.json` before publishing
4. **epubjs API**: May need adjustment based on actual library behavior

## Testing Checklist

- [ ] Extension activates correctly
- [ ] Commands are registered and accessible
- [ ] Context menu appears for supported files
- [ ] Keyboard shortcut works (Ctrl+Alt+R)
- [ ] Markdown file reading works
- [ ] Plain text file reading works
- [ ] PDF file reading works (if file available)
- [ ] EPUB file reading works (if file available)
- [ ] Webview displays correctly
- [ ] Keyboard controls work in webview
- [ ] Progress bar updates
- [ ] Configuration changes are reflected
- [ ] Error messages display correctly
- [ ] Memory cleanup on stop

## Common Issues and Solutions

### Issue: "Cannot find module 'epubjs'"

**Solution**: Run `npm install` to install dependencies

### Issue: "Cannot find module 'vscode'"

**Solution**: This is expected - `@types/vscode` provides types, actual module is provided by VS Code runtime

### Issue: epubjs import errors

**Solution**: May need to adjust import syntax based on library version. Try:

- `const epubjs = require('epubjs');`
- Or use dynamic import as currently implemented

### Issue: HTML template not loading

**Solution**:

- Verify `src/webview/rsvp.html` exists
- Check file path in `_getHtmlForWebview` method
- Verify `extensionUri` is correct

### Issue: Webview shows blank

**Solution**:

- Check browser console (Help → Toggle Developer Tools)
- Verify CSS/JS files are loading
- Check CSP errors in console
