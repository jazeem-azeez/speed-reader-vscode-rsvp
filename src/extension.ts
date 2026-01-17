import * as vscode from 'vscode';
import { RsvpController } from './rsvpController';

export function activate(context: vscode.ExtensionContext) {
  const controller = new RsvpController(context.extensionUri, context);
  
  // Register webview view provider
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('rsvp.webview', controller)
  );
  
  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('rsvp.start', () => controller.startReading()),
    vscode.commands.registerCommand('rsvp.stop', () => controller.stopReading()),
    vscode.commands.registerCommand('rsvp.toggle', () => controller.toggleReading()),
    vscode.commands.registerCommand('rsvp.startFromFile', (uri: vscode.Uri) => 
      controller.startReadingFromFile(uri))
  );
}

export function deactivate() {
  // Cleanup if needed
}

