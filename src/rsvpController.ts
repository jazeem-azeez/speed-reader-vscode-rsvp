import * as vscode from 'vscode';
import * as fs from 'fs';
import { 
  ExtensionToWebviewMessage, 
  WebviewToExtensionMessage,
  DisplayChunkMessage,
  UpdateWpmMessage,
  StopMessage,
  ShowHelpMessage
} from './types';
import { detectFormat } from './fileTypeDetector';
import { extractText, chunkText, addORPHighlight } from './textProcessor';

export class RsvpController implements vscode.WebviewViewProvider {
  public static readonly viewType = 'rsvp.webview';
  private _view?: vscode.WebviewView;
  private _extensionUri: vscode.Uri;
  private _context: vscode.ExtensionContext;
  private _isReading = false;
  private _chunks: string[] = [];
  private _currentIndex = 0;
  private _wpm: number;
  private _chunkSize: number;
  private _intervalId?: NodeJS.Timeout;
  private _fontFamily: string;
  private _htmlContent?: string;

  constructor(
    private readonly extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
  ) {
    this._extensionUri = extensionUri;
    this._context = context;
    
    // Load configuration
    const config = vscode.workspace.getConfiguration('rsvp');
    this._wpm = config.get<number>('defaultWPM', 450);
    this._chunkSize = config.get<number>('wordsPerChunk', 2);
    this._fontFamily = config.get<string>('fontFamily', 'monospace');

    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent) => {
      if (e.affectsConfiguration('rsvp')) {
        const updatedConfig = vscode.workspace.getConfiguration('rsvp');
        this._wpm = updatedConfig.get<number>('defaultWPM', 450);
        this._chunkSize = updatedConfig.get<number>('wordsPerChunk', 2);
        this._fontFamily = updatedConfig.get<string>('fontFamily', 'monospace');
        if (this._isReading) {
          this.updateWpm();
        }
      }
    });

    // Load saved state
    this.loadState();
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((message: WebviewToExtensionMessage) => {
      switch (message.command) {
        case 'togglePause':
          this.togglePause();
          break;
        case 'stop':
          this.stopReading();
          break;
        case 'speedUp':
          this.adjustSpeed(50);
          break;
        case 'speedDown':
          this.adjustSpeed(-50);
          break;
        case 'speedUpBig':
          this.adjustSpeed(100);
          break;
        case 'speedDownBig':
          this.adjustSpeed(-100);
          break;
        case 'resetSpeed':
          this._wpm = 450;
          this.updateWpm();
          break;
        case 'rewind':
          this.rewind(5);
          break;
        case 'skip':
          this.skip(5);
          break;
        case 'cycleChunkSize':
          this._chunkSize = (this._chunkSize % 5) + 1;
          this.restartReading().catch((err: unknown) => {
            const errorMessage = err instanceof Error ? err.message : String(err);
            vscode.window.showErrorMessage(`Failed to restart reading: ${errorMessage}`);
          });
          break;
        case 'toggleHelp':
          this.showHelp();
          break;
      }
    });

    webviewView.onDidDispose(() => {
      this.stopReading();
      this._view = undefined;
    });
  }

  public async startReading() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('Please open a file to start speed reading.');
      return;
    }

    const document = editor.document;
    const filePath = document.uri.fsPath;
    const format = detectFormat(filePath);

    try {
      let text: string;
      
      if (format === 'markdown' || format === 'text') {
        text = document.getText();
      } else {
        // For PDF/EPUB, extract text
        text = await extractText(filePath, format);
      }

      if (!text || text.trim().length === 0) {
        vscode.window.showWarningMessage('File is empty or contains no readable text.');
        return;
      }

      // Check file size (only if we have a file path)
      if (filePath && fs.existsSync(filePath)) {
        const fileSize = fs.statSync(filePath).size;
        const maxSize = format === 'pdf' || format === 'epub' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
        if (fileSize > maxSize) {
          vscode.window.showWarningMessage(
            `File is too large (${(fileSize / 1024 / 1024).toFixed(1)}MB). Maximum size is ${(maxSize / 1024 / 1024).toFixed(0)}MB.`
          );
          return;
        }
      }

      this._chunks = chunkText(text, this._chunkSize);
      this._currentIndex = 0;
      this._isReading = true;
      this.play();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to start reading: ${errorMessage}`);
    }
  }

  public async startReadingFromFile(uri: vscode.Uri) {
    try {
      const filePath = uri.fsPath;
      const format = detectFormat(filePath);
      
      // For PDF/EPUB, read directly from file
      if (format === 'pdf' || format === 'epub') {
        try {
          const text = await extractText(filePath, format);
          
          if (!text || text.trim().length === 0) {
            vscode.window.showWarningMessage('File is empty or contains no readable text.');
            return;
          }

          // Check file size
          if (fs.existsSync(filePath)) {
            const fileSize = fs.statSync(filePath).size;
            const maxSize = 50 * 1024 * 1024; // 50MB for PDF/EPUB
            if (fileSize > maxSize) {
              vscode.window.showWarningMessage(
                `File is too large (${(fileSize / 1024 / 1024).toFixed(1)}MB). Maximum size is ${(maxSize / 1024 / 1024).toFixed(0)}MB.`
              );
              return;
            }
          }

          this._chunks = chunkText(text, this._chunkSize);
          this._currentIndex = 0;
          this._isReading = true;
          this.play();
          return;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          vscode.window.showErrorMessage(`Failed to extract text from file: ${errorMessage}`);
          return;
        }
      }
      
      // For markdown/text, open in editor first
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc);
      // Small delay to ensure editor is active
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Start reading from editor
      await this.startReading();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to start reading from file: ${errorMessage}`);
    }
  }

  public stopReading() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = undefined;
    }
    this._isReading = false;
    this.sendMessage({ command: 'stop' });
    
    // Save state
    this.saveState();
    
    // Clear chunks to free memory
    this._chunks = [];
    
    // Jump to position in editor (approximate)
    const editor = vscode.window.activeTextEditor;
    if (editor && this._chunks.length > 0) {
      const approxPosition = editor.document.positionAt(
        Math.floor(editor.document.getText().length * (this._currentIndex / this._chunks.length))
      );
      editor.selection = new vscode.Selection(approxPosition, approxPosition);
      editor.revealRange(new vscode.Range(approxPosition, approxPosition));
    }
  }

  public toggleReading() {
    if (this._isReading) {
      this.stopReading();
    } else {
      this.startReading();
    }
  }

  public togglePause() {
    this._isReading = !this._isReading;
    if (this._isReading) {
      this.play();
    } else {
      this.pause();
    }
  }

  private play() {
    const delay = 60000 / this._wpm; // milliseconds per chunk
    this._intervalId = setInterval(() => {
      if (this._currentIndex >= this._chunks.length) {
        this.stopReading();
        return;
      }
      const chunk = this._chunks[this._currentIndex];
      if (!chunk || chunk.trim().length === 0) {
        this._currentIndex++;
        return;
      }
      const highlighted = addORPHighlight(chunk);
      const message: DisplayChunkMessage = {
        command: 'displayChunk',
        chunk: highlighted || '',
        progress: this._chunks.length > 0 ? (this._currentIndex / this._chunks.length) * 100 : 0,
        wpm: this._wpm,
        remaining: this._chunkSize > 0 && this._wpm > 0 ? Math.ceil((this._chunks.length - this._currentIndex) / (this._wpm / 60 / this._chunkSize)) : 0
      };
      this.sendMessage(message);
      this._currentIndex++;
    }, delay);
  }

  private pause() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = undefined;
    }
  }

  private adjustSpeed(delta: number) {
    this._wpm = Math.max(100, Math.min(1200, this._wpm + delta));
    this.updateWpm();
  }

  private updateWpm() {
    if (this._isReading) {
      this.pause();
      this.play();
    }
    const message: UpdateWpmMessage = { command: 'updateWpm', wpm: this._wpm };
    this.sendMessage(message);
  }

  private rewind(chunks: number) {
    this._currentIndex = Math.max(0, this._currentIndex - chunks);
  }

  private skip(chunks: number) {
    this._currentIndex = Math.min(this._chunks.length - 1, this._currentIndex + chunks);
  }

  private async restartReading() {
    const wasReading = this._isReading;
    this.stopReading();
    if (wasReading) {
      // Small delay to ensure cleanup completes
      await new Promise<void>(resolve => setTimeout(resolve, 100));
      await this.startReading();
    }
  }

  private showHelp() {
    const helpText = 'SPACE: pause | ↑↓: ±50 wpm | Shift+↑↓: ±100 | [ ]: rewind/skip 5 | c: cycle chunks | Esc/q: stop | ?: help';
    const message: ShowHelpMessage = { command: 'showHelp', text: helpText };
    this.sendMessage(message);
  }

  private sendMessage(message: ExtensionToWebviewMessage) {
    this._view?.webview.postMessage(message);
  }

  private async saveState() {
    const state = {
      currentIndex: this._currentIndex,
      wpm: this._wpm,
      chunkSize: this._chunkSize
    };
    await this._context.workspaceState.update('rsvp.state', state);
  }

  private loadState() {
    const state = this._context.workspaceState.get<{currentIndex: number, wpm: number, chunkSize: number}>('rsvp.state');
    if (state) {
      this._currentIndex = state.currentIndex;
      this._wpm = state.wpm;
      this._chunkSize = state.chunkSize;
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    if (!this._htmlContent) {
      const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'rsvp.html');
      try {
        this._htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to load RSVP webview HTML: ${error}`);
        return '<html><body>Error loading webview</body></html>';
      }
    }

    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'rsvp.css'));
    const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'rsvp.js'));
    const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src ${webview.cspSource}; font-src ${webview.cspSource};">`;

    if (!this._htmlContent) {
      return '<html><body>Error: HTML content not loaded</body></html>';
    }
    
    return this._htmlContent
      .replace(/\$\{csp\}/g, csp)
      .replace(/\$\{cssUri\}/g, cssUri.toString())
      .replace(/\$\{jsUri\}/g, jsUri.toString())
      .replace(/\$\{fontFamily\}/g, this._fontFamily);
  }
}

