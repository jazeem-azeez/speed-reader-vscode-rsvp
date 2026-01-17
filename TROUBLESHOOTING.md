# Troubleshooting: Extension Not Showing

## Issue: Context Menu Not Appearing

### Check 1: Extension is Loaded
1. In the Extension Development Host window, open the Command Palette (`Cmd+Shift+P`)
2. Type "Developer: Reload Window" and run it
3. This reloads the extension

### Check 2: Verify Extension is Active
1. Open the Debug Console: `View > Debug Console` (or `Cmd+Shift+Y`)
2. Look for any error messages
3. Check if you see "RSVP Speed Reader" extension loaded

### Check 3: Test Commands Directly
1. Press `Cmd+Shift+P`
2. Type "RSVP: Start Speed Reading"
3. If the command appears, the extension is loaded
4. If it doesn't appear, the extension isn't activating

### Check 4: Context Menu Location
The context menu appears when you:
- Right-click on a **file** in the Explorer sidebar (not a folder)
- The file must have extension: `.md`, `.markdown`, `.txt`, `.pdf`, or `.epub`
- Make sure you're right-clicking the file name, not empty space

### Check 5: Extension Activation
The extension activates when:
- You open a markdown/plaintext file
- You use the Command Palette
- You click the RSVP icon in Activity Bar
- You right-click a supported file

## Issue: Activity Bar Icon Not Showing

### Check 1: Icon File
- Verify `media/icon.svg` exists
- The icon should be a valid SVG file

### Check 2: Reload Window
1. `Cmd+Shift+P` → "Developer: Reload Window"
2. Check the Activity Bar (left sidebar) for RSVP icon

### Check 3: Check Debug Console
- Look for errors about missing icon file
- Icon path should be `media/icon.svg`

## Quick Fix Steps

1. **Reload the Extension Development Host window**:
   - `Cmd+Shift+P` → "Developer: Reload Window"

2. **Check Debug Console for errors**:
   - `View > Debug Console` or `Cmd+Shift+Y`
   - Look for red error messages

3. **Verify file is compiled**:
   ```bash
   npm run compile
   ```
   - Make sure `out/extension.js` exists

4. **Test command directly**:
   - `Cmd+Shift+P` → "RSVP: Start Speed Reading"
   - If command works, extension is loaded

5. **Check context menu**:
   - Right-click a `.md` or `.txt` file in Explorer
   - Look for "Speed Read with RSVP" option

## Common Issues

### Extension Not Activating
- **Cause**: Activation events not triggered
- **Fix**: Open a markdown file or use Command Palette

### Context Menu Not Showing
- **Cause**: Right-clicking wrong location or file type not supported
- **Fix**: Right-click file name (not folder) with extension `.md`, `.txt`, `.pdf`, or `.epub`

### Icon Not Showing
- **Cause**: Icon file path incorrect or file missing
- **Fix**: Verify `media/icon.svg` exists and path is correct in `package.json`

### Commands Not Working
- **Cause**: Extension not loaded or errors in code
- **Fix**: Check Debug Console for errors, reload window

## Still Not Working?

1. **Check the Debug Console** (`Cmd+Shift+Y`) for error messages
2. **Restart the Extension Development Host**:
   - Close the Extension Development Host window
   - Press F5 again (or use Command Palette)
3. **Verify compilation**:
   ```bash
   cd /Users/jazeem/aicorp-work/vscode-extension
   npm run compile
   ```
4. **Check extension is registered**:
   - `Cmd+Shift+P` → "Extensions: Show Installed Extensions"
   - Look for "RSVP Speed Reader" in the list

