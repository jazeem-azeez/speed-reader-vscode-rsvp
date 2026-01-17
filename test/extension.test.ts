import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

suite('Extension Tests', () => {
  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('rsvp-speed-reader'));
  });

  test('Commands should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('rsvp.start'));
    assert.ok(commands.includes('rsvp.stop'));
    assert.ok(commands.includes('rsvp.toggle'));
    assert.ok(commands.includes('rsvp.startFromFile'));
  });
});

suite('Integration Tests', () => {
  test('Webview message passing', async () => {
    // This is a basic test - full integration would require opening VS Code
    // For now, we verify the command exists
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('rsvp.start'));
  });
});

