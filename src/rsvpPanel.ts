import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { 
  ExtensionToWebviewMessage, 
  WebviewToExtensionMessage,
  DisplayChunkMessage,
  UpdateWpmMessage,
  StopMessage,
  ShowHelpMessage,
  FileListMessage,
  SelectFileMessage,
  UpdateFileProgressMessage,
  StructuredChunk
} from './types';
import { detectFormat } from './fileTypeDetector';
import { extractTextWithHierarchy, chunkTextWithHierarchy, addORPHighlight } from './textProcessor';
import { scanFolder } from './fileScanner';

interface FileState {
  currentIndex: number;
  wpm: number;
  chunkSize: number;
  timestamp: number;
}

export class RsvpPanel {
  private static readonly viewType = 'rsvp.speedRead';
  private static _panels: Map<string, RsvpPanel> = new Map();
  
  private _panel: vscode.WebviewPanel;
  private _extensionUri: vscode.Uri;
  private _context: vscode.ExtensionContext;
  private _disposables: vscode.Disposable[] = [];
  
  // Reading state
  private _isReading = false;
  private _chunks: StructuredChunk[] = [];
  private _currentIndex = 0;
  private _wpm: number;
  private _chunkSize: number;
  private _intervalId?: NodeJS.Timeout;
  private _fontFamily: string;
  private _bodyFontSize: number;
  private _titleFontSizeH1: number;
  private _titleFontSizeH2: number;
  private _titleFontSizeH3: number;
  private _titlePauseDuration: number;
  
  // File management
  private _files: vscode.Uri[] = [];
  private _currentFileIndex = 0;
  private _currentFileUri?: vscode.Uri;
  private _autoPlay = false;
  private _fileStates: Map<string, FileState> = new Map();
  
  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._context = context;
    
    // Load configuration
    const config = vscode.workspace.getConfiguration('rsvp');
    this._wpm = config.get<number>('defaultWPM', 450);
    this._chunkSize = config.get<number>('wordsPerChunk', 1);
    this._fontFamily = config.get<string>('fontFamily', 'monospace');
    this._bodyFontSize = config.get<number>('bodyFontSize', 48);
    this._titleFontSizeH1 = config.get<number>('titleFontSizeH1', 1.5);
    this._titleFontSizeH2 = config.get<number>('titleFontSizeH2', 1.3);
    this._titleFontSizeH3 = config.get<number>('titleFontSizeH3', 1.15);
    this._titlePauseDuration = config.get<number>('titlePauseDuration', 500);
    
    // Set up webview
    this._panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    
    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
    
    // Handle messages from webview
    this._panel.webview.onDidReceiveMessage(
      (message: WebviewToExtensionMessage) => {
        this.handleMessage(message);
      },
      null,
      this._disposables
    );
    
    // Handle panel disposal
    this._panel.onDidDispose(() => {
      this.stopReading();
      // Try to delete from map, but handle case where cspSource might not be accessible
      try {
        const cspSource = this._panel.webview?.cspSource;
        if (cspSource) {
          RsvpPanel._panels.delete(cspSource);
        } else {
          // If cspSource is not available, remove by finding the panel instance
          for (const [key, panel] of RsvpPanel._panels.entries()) {
            if (panel === this) {
              RsvpPanel._panels.delete(key);
              break;
            }
          }
        }
      } catch (error) {
        // If deletion fails, try to find and remove by instance
        for (const [key, panel] of RsvpPanel._panels.entries()) {
          if (panel === this) {
            RsvpPanel._panels.delete(key);
            break;
          }
        }
      }
      this._disposables.forEach(d => d.dispose());
    }, null, this._disposables);
    
    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent) => {
      if (e.affectsConfiguration('rsvp')) {
        const updatedConfig = vscode.workspace.getConfiguration('rsvp');
        this._wpm = updatedConfig.get<number>('defaultWPM', 450);
        this._chunkSize = updatedConfig.get<number>('wordsPerChunk', 1);
        this._fontFamily = updatedConfig.get<string>('fontFamily', 'monospace');
        this._bodyFontSize = updatedConfig.get<number>('bodyFontSize', 48);
        this._titleFontSizeH1 = updatedConfig.get<number>('titleFontSizeH1', 1.5);
        this._titleFontSizeH2 = updatedConfig.get<number>('titleFontSizeH2', 1.3);
        this._titleFontSizeH3 = updatedConfig.get<number>('titleFontSizeH3', 1.15);
        this._titlePauseDuration = updatedConfig.get<number>('titlePauseDuration', 500);
        if (this._isReading) {
          this.updateWpm();
        }
      }
    }, null, this._disposables);
  }
  
  public static getExistingPanel(): RsvpPanel | undefined {
    // Clean up disposed panels first
    const validPanels: RsvpPanel[] = [];
    for (const [key, panel] of RsvpPanel._panels.entries()) {
      try {
        if (panel._panel && panel._panel.webview) {
          validPanels.push(panel);
        } else {
          RsvpPanel._panels.delete(key);
        }
      } catch (error) {
        RsvpPanel._panels.delete(key);
      }
    }
    
    return validPanels.length > 0 ? validPanels[0] : undefined;
  }
  
  public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext, files: vscode.Uri[]): RsvpPanel {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;
    
    // Try to find existing panel (clean up disposed panels first)
    const validPanels: RsvpPanel[] = [];
    for (const [key, panel] of RsvpPanel._panels.entries()) {
      try {
        // Check if panel is still valid by trying to access its webview
        if (panel._panel && panel._panel.webview) {
          validPanels.push(panel);
        } else {
          // Panel is disposed, remove from map
          RsvpPanel._panels.delete(key);
        }
      } catch (error) {
        // Panel is invalid, remove from map
        RsvpPanel._panels.delete(key);
      }
    }
    
    // Try to reuse first valid panel
    if (validPanels.length > 0) {
      const existingPanel = validPanels[0];
      try {
        existingPanel._panel.reveal(column);
        existingPanel.setFiles(files);
        return existingPanel;
      } catch (error) {
        // Panel reveal failed, will create new one below
      }
    }
    
    // Create new panel
    const panel = vscode.window.createWebviewPanel(
      RsvpPanel.viewType,
      files.length === 1 
        ? `Speed Read: ${path.basename(files[0].fsPath)}`
        : `Speed Read: ${files.length} files`,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [extensionUri],
        retainContextWhenHidden: true
      }
    );
    
    const rsvpPanel = new RsvpPanel(panel, extensionUri, context);
    rsvpPanel.setFiles(files);
    RsvpPanel._panels.set(panel.webview.cspSource, rsvpPanel);
    
    return rsvpPanel;
  }
  
  public setFiles(files: vscode.Uri[]): void {
    this._files = files;
    if (files.length > 0) {
      // If we already have files, append new ones (queue behavior)
      // Otherwise, set as new list
      this._currentFileIndex = 0;
      this._currentFileUri = files[0];
      this.sendFileList();
      // Send initial WPM to update speed display
      this.updateWpm();
      this.loadFile(files[0], false);
    }
  }
  
  public addFilesToQueue(files: vscode.Uri[]): void {
    // Add new files to the queue without replacing existing ones
    const existingPaths = new Set(this._files.map(f => f.fsPath));
    const newFiles = files.filter(f => !existingPaths.has(f.fsPath));
    
    if (newFiles.length > 0) {
      this._files.push(...newFiles);
      this.sendFileList();
      vscode.window.showInformationMessage(`Added ${newFiles.length} file(s) to reading queue.`);
    } else {
      vscode.window.showInformationMessage('All selected files are already in the queue.');
    }
  }
  
  private sendFileList(): void {
    const fileList: Array<{ uri: string; name: string; progress?: number }> = this._files.map((uri, index) => {
      const state = this._fileStates.get(uri.fsPath);
      return {
        uri: uri.fsPath,
        name: path.basename(uri.fsPath),
        progress: state ? (state.currentIndex / (this._chunks.length || 1)) * 100 : 0
      };
    });
    
    const message: FileListMessage = {
      command: 'fileList',
      files: fileList,
      currentIndex: this._currentFileIndex
    };
    this.sendMessage(message);
  }
  
  private async loadFile(uri: vscode.Uri, autoResume: boolean): Promise<void> {
    try {
      const filePath = uri.fsPath;
      const format = detectFormat(filePath);
      
      // Check file size
      if (fs.existsSync(filePath)) {
        const fileSize = fs.statSync(filePath).size;
        const maxSize = format === 'pdf' || format === 'epub' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
        if (fileSize > maxSize) {
          vscode.window.showWarningMessage(
            `File is too large (${(fileSize / 1024 / 1024).toFixed(1)}MB). Maximum size is ${(maxSize / 1024 / 1024).toFixed(0)}MB.`
          );
          return;
        }
      }
      
      // Extract text with hierarchy
      const structuredChunks = await extractTextWithHierarchy(filePath, format);
      
      if (structuredChunks.length === 0) {
        vscode.window.showWarningMessage('File is empty or contains no readable text.');
        return;
      }
      
      // Chunk the text
      this._chunks = chunkTextWithHierarchy(structuredChunks, this._chunkSize, this._titlePauseDuration);
      
      // Load saved state for this file (from memory or workspace state)
      let savedState = this._fileStates.get(filePath);
      if (!savedState) {
        // Try loading from workspace state
        const stateKey = `rsvp.state.${filePath}`;
        const workspaceState = this._context.workspaceState.get<FileState>(stateKey);
        if (workspaceState) {
          savedState = workspaceState;
          this._fileStates.set(filePath, savedState);
        }
      }
      
      if (savedState && autoResume) {
        this._currentIndex = Math.min(savedState.currentIndex, this._chunks.length - 1);
        this._wpm = savedState.wpm;
        this._chunkSize = savedState.chunkSize;
      } else {
        this._currentIndex = 0;
      }
      
      this._currentFileUri = uri;
      
      // Update file list with progress
      this.sendFileList();
      
      // If auto-play and has saved state, start reading
      if (autoResume && savedState && this._autoPlay) {
        this.play();
      } else {
        // Show idle state with play button
        this.sendMessage({ command: 'stop' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to load file: ${errorMessage}`);
    }
  }
  
  private handleMessage(message: WebviewToExtensionMessage): void {
    switch (message.command) {
      case 'play':
        if (this._chunks.length > 0) {
          this.play();
        } else if (this._files.length > 0) {
          this.loadFile(this._files[this._currentFileIndex], false).then(() => {
            this.play();
          });
        }
        break;
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
      case 'selectFile':
        if (message.fileIndex >= 0 && message.fileIndex < this._files.length) {
          this._currentFileIndex = message.fileIndex;
          this.loadFile(this._files[this._currentFileIndex], this._autoPlay);
        }
        break;
      case 'nextFile':
        if (this._currentFileIndex < this._files.length - 1) {
          this._currentFileIndex++;
          this.loadFile(this._files[this._currentFileIndex], this._autoPlay);
        }
        break;
      case 'prevFile':
        if (this._currentFileIndex > 0) {
          this._currentFileIndex--;
          this.loadFile(this._files[this._currentFileIndex], this._autoPlay);
        }
        break;
      case 'toggleFileList':
        // Toggle handled in webview
        break;
      case 'toggleAutoPlay':
        this._autoPlay = !this._autoPlay;
        break;
    }
  }
  
  private play(): void {
    if (this._chunks.length === 0) return;
    
    this._isReading = true;
    this.processNextChunk();
  }
  
  private processNextChunk(): void {
    if (!this._isReading || this._currentIndex >= this._chunks.length) {
      // End of file
      this.handleFileEnd();
      return;
    }
    
    const chunk = this._chunks[this._currentIndex];
    
    if (chunk.type === 'pause') {
      // Wait for pause duration
      setTimeout(() => {
        if (this._isReading) {
          this._currentIndex++;
          this.processNextChunk();
        }
      }, chunk.duration || this._titlePauseDuration);
      return;
    }
    
    // Calculate delay based on WPM
    const delay = 60000 / this._wpm; // milliseconds per chunk
    
    this._intervalId = setTimeout(() => {
      if (!this._isReading) return;
      
      if (chunk.text && chunk.text.trim().length > 0) {
        const highlighted = addORPHighlight(chunk.text);
        const message: DisplayChunkMessage = {
          command: 'displayChunk',
          chunk: highlighted || '',
          chunkType: chunk.type,
          chunkLevel: chunk.level,
          progress: this._chunks.length > 0 ? (this._currentIndex / this._chunks.length) * 100 : 0,
          wpm: this._wpm,
          remaining: this._chunkSize > 0 && this._wpm > 0 ? Math.ceil((this._chunks.length - this._currentIndex) / (this._wpm / 60 / this._chunkSize)) : 0
        };
        this.sendMessage(message);
      }
      
      // Update file progress
      if (this._currentFileUri) {
        this.updateFileProgress();
      }
      
      this._currentIndex++;
      this.processNextChunk();
    }, delay);
  }
  
  private handleFileEnd(): void {
    // Save state
    if (this._currentFileUri) {
      this.saveFileState();
    }
    
    // Auto-advance to next file if enabled
    if (this._autoPlay && this._currentFileIndex < this._files.length - 1) {
      this._currentFileIndex++;
      this.loadFile(this._files[this._currentFileIndex], true).then(() => {
        this.play();
      });
    } else {
      this.stopReading();
    }
  }
  
  private stopReading(): void {
    if (this._intervalId) {
      clearTimeout(this._intervalId);
      this._intervalId = undefined;
    }
    this._isReading = false;
    
    // Save state
    if (this._currentFileUri) {
      this.saveFileState();
    }
    
    this.sendMessage({ command: 'stop' });
  }
  
  private togglePause(): void {
    this._isReading = !this._isReading;
    if (this._isReading) {
      this.play();
    } else {
      if (this._intervalId) {
        clearTimeout(this._intervalId);
        this._intervalId = undefined;
      }
      // Save state on pause
      if (this._currentFileUri) {
        this.saveFileState();
      }
    }
    // Update UI with current playing state
    const message: UpdateWpmMessage = { 
      command: 'updateWpm', 
      wpm: this._wpm,
      isPlaying: this._isReading
    };
    this.sendMessage(message);
  }
  
  private adjustSpeed(delta: number): void {
    this._wpm = Math.max(100, Math.min(1200, this._wpm + delta));
    this.updateWpm();
  }
  
  private updateWpm(): void {
    if (this._isReading) {
      // Restart reading with new speed
      const wasReading = this._isReading;
      if (this._intervalId) {
        clearTimeout(this._intervalId);
        this._intervalId = undefined;
      }
      if (wasReading) {
        this.play();
      }
    }
    const message: UpdateWpmMessage = { 
      command: 'updateWpm', 
      wpm: this._wpm,
      isPlaying: this._isReading
    };
    this.sendMessage(message);
  }
  
  private rewind(chunks: number): void {
    this._currentIndex = Math.max(0, this._currentIndex - chunks);
  }
  
  private skip(chunks: number): void {
    this._currentIndex = Math.min(this._chunks.length - 1, this._currentIndex + chunks);
  }
  
  private async restartReading(): Promise<void> {
    const wasReading = this._isReading;
    this.stopReading();
    if (wasReading && this._currentFileUri) {
      await new Promise<void>(resolve => setTimeout(resolve, 100));
      await this.loadFile(this._currentFileUri, false);
      this.play();
    }
  }
  
  private showHelp(): void {
    const helpText = 'SPACE: pause | ↑↓: ±50 wpm | Shift+↑↓: ±100 | [ ]: rewind/skip 5 | c: cycle chunks | Esc/q: stop | ?: help';
    const message: ShowHelpMessage = { command: 'showHelp', text: helpText };
    this.sendMessage(message);
  }
  
  private saveFileState(): void {
    if (!this._currentFileUri) return;
    
    const state: FileState = {
      currentIndex: this._currentIndex,
      wpm: this._wpm,
      chunkSize: this._chunkSize,
      timestamp: Date.now()
    };
    
    this._fileStates.set(this._currentFileUri.fsPath, state);
    
    // Also save to workspace state for persistence
    const stateKey = `rsvp.state.${this._currentFileUri.fsPath}`;
    this._context.workspaceState.update(stateKey, state);
    
    // Update file list progress
    this.updateFileProgress();
  }
  
  private updateFileProgress(): void {
    if (!this._currentFileUri) return;
    
    const progress = this._chunks.length > 0 ? (this._currentIndex / this._chunks.length) * 100 : 0;
    const state = this._fileStates.get(this._currentFileUri.fsPath);
    if (state) {
      state.currentIndex = this._currentIndex;
    }
    
    const message: UpdateFileProgressMessage = {
      command: 'updateFileProgress',
      fileIndex: this._currentFileIndex,
      progress
    };
    this.sendMessage(message);
    
    // Update file list
    this.sendFileList();
  }
  
  private sendMessage(message: ExtensionToWebviewMessage): void {
    this._panel.webview.postMessage(message);
  }
  
  private _getHtmlForWebview(webview: vscode.Webview): string {
    const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'rsvp.html');
    let htmlContent: string;
    try {
      htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to load RSVP webview HTML: ${error}`);
      return '<html><body>Error loading webview</body></html>';
    }

    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'rsvp.css'));
    const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'rsvp.js'));
    const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src ${webview.cspSource}; font-src ${webview.cspSource};">`;

    return htmlContent
      .replace(/\$\{csp\}/g, csp)
      .replace(/\$\{cssUri\}/g, cssUri.toString())
      .replace(/\$\{jsUri\}/g, jsUri.toString())
      .replace(/\$\{fontFamily\}/g, this._fontFamily)
      .replace(/\$\{bodyFontSize\}/g, this._bodyFontSize.toString())
      .replace(/\$\{titleFontSizeH1\}/g, (this._bodyFontSize * this._titleFontSizeH1).toString())
      .replace(/\$\{titleFontSizeH2\}/g, (this._bodyFontSize * this._titleFontSizeH2).toString())
      .replace(/\$\{titleFontSizeH3\}/g, (this._bodyFontSize * this._titleFontSizeH3).toString());
  }
}
