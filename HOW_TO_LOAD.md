# How to Load and Test Your Extension

## Step-by-Step Instructions

### Method 1: Using F5 (Recommended)

1. **Open the project in VS Code**:

   ```bash
   code /Users/jazeem/aicorp-work/vscode-extension
   ```

   Or open VS Code and use `File > Open Folder` to select the extension folder.

2. **Press F5** (or just `F5` on Mac - NOT Cmd+F5, which opens accessibility)
   - On Mac: Use **F5** key alone, or **Fn+F5** if F5 is mapped to a function key
   - This will:
     - Compile TypeScript (if needed)
     - Launch a new "Extension Development Host" window
     - Load your extension in that new window

3. **In the new Extension Development Host window**:
   - This is a separate VS Code window where your extension is loaded
   - You'll see `[Extension Development Host]` in the window title

### Method 2: Using Command Palette (Recommended for Mac)

1. Open the project in VS Code
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type "Debug: Start Debugging" and select it
4. Choose "Run Extension" from the configuration list

**Note for Mac users**: If `F5` doesn't work, use this method instead (Cmd+F5 opens VoiceOver accessibility).

## Testing Your Extension

Once the Extension Development Host window opens:

### Test 1: Using Keyboard Shortcut

1. Open a markdown file (`.md`) or text file (`.txt`)
2. Press `Ctrl+Alt+R` (or `Cmd+Alt+R` on Mac)
3. The RSVP webview should appear in the sidebar and start reading

### Test 2: Using Command Palette

1. Open a file
2. Press `Cmd+Shift+P` (or `Ctrl+Shift+P`)
3. Type "RSVP: Start Speed Reading" and select it
4. The speed reader should start

### Test 3: Using Context Menu

1. In the Explorer sidebar, right-click on a `.md`, `.txt`, `.pdf`, or `.epub` file
2. Select "Speed Read with RSVP"
3. The extension should start reading the file

### Test 4: Using Activity Bar

1. Look for the RSVP icon in the Activity Bar (left sidebar)
2. Click it to open the Speed Reader webview
3. Then use one of the methods above to start reading

## Keyboard Controls (While Reading)

- **Space**: Pause/Resume
- **Escape** or **Q**: Stop reading
- **↑/↓**: Increase/Decrease speed (50 WPM)
- **←/→**: Rewind/Skip (5 chunks)
- **H**: Show/Hide help
- **C**: Cycle chunk size (1-5 words)

## Troubleshooting

### Extension doesn't load

- Check the Debug Console (View > Debug Console) for errors
- Make sure TypeScript compiled: `npm run compile`
- Check that `out/extension.js` exists

### Webview doesn't appear

- Check the Debug Console for errors
- Verify `src/webview/rsvp.js` exists (compiled from `rsvp.ts`)
- Check browser console: Help > Toggle Developer Tools

### Commands not working

- Reload the Extension Development Host window: `Cmd+R` (Mac) or `Ctrl+R` (Windows/Linux)
- Check the Debug Console for error messages

### PDF/EPUB not working

- Make sure `pdf-parse` and `epubjs` are installed: `npm install`
- Check file size limits (50MB for PDF/EPUB)
- Verify the file is not encrypted (PDF) or corrupted

## Stopping the Extension

- Close the Extension Development Host window
- Or press `Shift+F5` in the original VS Code window to stop debugging

## Making Changes

1. Edit your TypeScript files in `src/`
2. Save the files
3. Press `Cmd+R` (Mac) or `Ctrl+R` (Windows/Linux) in the Extension Development Host window to reload
4. Or stop and restart debugging (F5 again)

## Watch Mode (Auto-compile)

For automatic compilation while developing:

1. Open Terminal in VS Code (`Ctrl+`` ` or `View > Terminal`)
2. Run: `npm run watch`
3. This will automatically recompile when you save TypeScript files
