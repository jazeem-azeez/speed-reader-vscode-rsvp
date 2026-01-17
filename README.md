# RSVP Speed Reader

A high-performance VS Code extension for speed reading using Rapid Serial Visual Presentation (RSVP) with Optimal Recognition Point (ORP) highlighting. Supports Markdown, plain text, PDF, and EPUB files.

## Features

- **RSVP Speed Reading**: Display words one chunk at a time at configurable speeds (100-1200 WPM)
- **ORP Highlighting**: Optimal Recognition Point highlighting at 38% of word length for improved reading speed
- **Multiple Formats**: Support for Markdown, plain text, PDF, and EPUB files
- **Keyboard-First Design**: Full keyboard control for efficient reading
- **Performance-Optimized**: Streaming text extraction, memory-efficient chunking, lazy loading
- **Context Menu Integration**: Right-click files in Explorer to start reading
- **Progress Tracking**: Visual progress bar and reading statistics
- **Theme-Aware**: Automatically adapts to VS Code theme (light/dark/high contrast)

## Usage

### Starting Speed Reading

**Method 1: Keyboard Shortcut**
- Open a supported file (`.md`, `.txt`, `.pdf`, `.epub`)
- Press `Ctrl+Alt+R` (Mac: `Cmd+Alt+R`)

**Method 2: Command Palette**
- Press `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`)
- Type "RSVP: Start Speed Reading"
- Press Enter

**Method 3: Context Menu**
- Right-click on a file in the Explorer
- Select "Speed Read with RSVP"

**Method 4: Activity Bar**
- Click the RSVP icon in the activity bar (left sidebar)
- The webview will open, then use any method above to start

### Keyboard Controls

During reading, use these keyboard shortcuts:

- `Space` - Pause/Resume reading
- `↑` / `↓` - Increase/Decrease speed by 50 WPM
- `Shift+↑` / `Shift+↓` - Increase/Decrease speed by 100 WPM
- `0` or `R` - Reset speed to default (450 WPM)
- `[` / `]` - Rewind/Skip 5 chunks
- `C` - Cycle chunk size (1-5 words)
- `?` or `F1` - Show help
- `Esc` or `Q` - Stop reading

### Configuration

Open VS Code settings (`Ctrl+,` or `Cmd+,`) and search for "RSVP":

- **rsvp.defaultWPM**: Default words per minute (100-1200, default: 450)
- **rsvp.wordsPerChunk**: Number of words displayed at once (1-5, default: 2)
- **rsvp.fontFamily**: Font family for the reading display (default: monospace)

## Requirements

- VS Code 1.85.0 or higher

## Installation

1. Open VS Code
2. Go to Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search for "RSVP Speed Reader"
4. Click Install

## Performance

The extension is optimized for performance:

- **Lazy Loading**: PDF/EPUB libraries only load when needed
- **Streaming Processing**: Large files processed incrementally
- **Memory Efficient**: Chunks processed and discarded, not stored
- **Fast Startup**: < 100ms activation time
- **Low Memory**: < 50MB for typical documents

## Supported File Types

- **Markdown**: `.md`, `.markdown`
- **Plain Text**: `.txt`
- **PDF**: `.pdf` (text extraction only, no rendering)
- **EPUB**: `.epub` (text extraction, streaming)

## Limitations

- PDF files must be unencrypted
- Very large files (>10MB text, >50MB PDF/EPUB) may be slow
- Complex PDF layouts may not extract perfectly
- EPUB scripts and complex CSS are skipped (text only)

## Troubleshooting

**Reading doesn't start:**
- Ensure a supported file type is open
- Check that the file contains readable text
- Try using Command Palette method

**PDF/EPUB extraction fails:**
- Verify the file is not encrypted or corrupted
- Check file size limits (10MB text, 50MB PDF/EPUB)
- Try a different file to isolate the issue

**Performance issues:**
- Reduce chunk size for faster processing
- Close other extensions
- Check file size (very large files may be slow)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

