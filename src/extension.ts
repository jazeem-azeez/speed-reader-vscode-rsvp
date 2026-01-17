import * as vscode from 'vscode';
import { RsvpPanel } from './rsvpPanel';
import { scanFolder } from './fileScanner';

export function activate(context: vscode.ExtensionContext) {
  // Register command: Speed read current file
  context.subscriptions.push(
    vscode.commands.registerCommand('rsvp.speedReadCurrentFile', async () => {
      try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showErrorMessage('Please open a file to start speed reading.');
          return;
        }
        
        const uri = editor.document.uri;
        const files = await scanFolder(uri);
        
        if (files.length === 0) {
          vscode.window.showWarningMessage('No supported files found.');
          return;
        }
        
        const panel = RsvpPanel.createOrShow(context.extensionUri, context, files);
        panel.setFiles(files);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to start speed reading: ${errorMessage}`);
        console.error('Error in rsvp.speedReadCurrentFile:', error);
      }
    })
  );
  
  // Register command: Speed read file/folder (from context menu or command palette)
  context.subscriptions.push(
    vscode.commands.registerCommand('rsvp.speedReadFile', async (uri?: vscode.Uri) => {
      try {
        let targetUri: vscode.Uri | undefined = uri;
        
        // If no URI provided, try to get from active editor or show picker
        if (!targetUri) {
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            targetUri = editor.document.uri;
          } else {
            // Show file picker
            const selected = await vscode.window.showOpenDialog({
              canSelectFiles: true,
              canSelectFolders: true,
              canSelectMany: false,
              openLabel: 'Speed Read'
            });
            
            if (!selected || selected.length === 0) {
              return;
            }
            
            targetUri = selected[0];
          }
        }
        
        if (!targetUri) {
          vscode.window.showErrorMessage('Please select a file or folder to speed read.');
          return;
        }
        
        const files = await scanFolder(targetUri);
        
        if (files.length === 0) {
          vscode.window.showWarningMessage('No supported files found.');
          return;
        }
        
        const panel = RsvpPanel.createOrShow(context.extensionUri, context, files);
        panel.setFiles(files);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to start speed reading: ${errorMessage}`);
        console.error('Error in rsvp.speedReadFile:', error);
      }
    })
  );
  
  // Register command: Queue file/folder (add to existing panel or create new)
  context.subscriptions.push(
    vscode.commands.registerCommand('rsvp.queueFile', async (uri?: vscode.Uri) => {
      try {
        let targetUri: vscode.Uri | undefined = uri;
        
        if (!targetUri) {
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            targetUri = editor.document.uri;
          } else {
            const selected = await vscode.window.showOpenDialog({
              canSelectFiles: true,
              canSelectFolders: true,
              canSelectMany: false,
              openLabel: 'Queue for Speed Read'
            });
            
            if (!selected || selected.length === 0) {
              return;
            }
            
            targetUri = selected[0];
          }
        }
        
        if (!targetUri) {
          vscode.window.showErrorMessage('Please select a file or folder to queue.');
          return;
        }
        
        const files = await scanFolder(targetUri);
        
        if (files.length === 0) {
          vscode.window.showWarningMessage('No supported files found.');
          return;
        }
        
        // Try to find existing panel to add to queue
        const existingPanel = RsvpPanel.getExistingPanel();
        if (existingPanel) {
          existingPanel.addFilesToQueue(files);
        } else {
          // No existing panel, create new one
          const panel = RsvpPanel.createOrShow(context.extensionUri, context, files);
          panel.setFiles(files);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to queue file: ${errorMessage}`);
        console.error('Error in rsvp.queueFile:', error);
      }
    })
  );
}

export function deactivate() {
  // Cleanup if needed
}

