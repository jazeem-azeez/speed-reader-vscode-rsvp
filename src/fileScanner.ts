import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { detectFormat } from './fileTypeDetector';

const SUPPORTED_EXTENSIONS = ['.md', '.markdown', '.txt', '.pdf', '.epub'];

/**
 * Recursively scans a folder for supported files
 * @param uri The folder or file URI to scan
 * @returns Array of file URIs sorted alphabetically
 */
export async function scanFolder(uri: vscode.Uri): Promise<vscode.Uri[]> {
  const files: vscode.Uri[] = [];
  
  try {
    const stat = await vscode.workspace.fs.stat(uri);
    
    // If it's a file, check if it's supported and return it
    if (stat.type === vscode.FileType.File) {
      const ext = path.extname(uri.fsPath).toLowerCase();
      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        return [uri];
      }
      return [];
    }
    
    // If it's a folder, recursively scan
    if (stat.type === vscode.FileType.Directory) {
      await scanDirectoryRecursive(uri, files);
    }
  } catch (error) {
    // If stat fails, try using fs.existsSync as fallback
    if (fs.existsSync(uri.fsPath)) {
      const stats = fs.statSync(uri.fsPath);
      if (stats.isFile()) {
        const ext = path.extname(uri.fsPath).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          return [uri];
        }
      } else if (stats.isDirectory()) {
        await scanDirectoryRecursive(uri, files);
      }
    }
  }
  
  // Sort alphabetically by path
  files.sort((a, b) => a.fsPath.localeCompare(b.fsPath));
  
  return files;
}

async function scanDirectoryRecursive(dirUri: vscode.Uri, files: vscode.Uri[]): Promise<void> {
  try {
    const entries = await vscode.workspace.fs.readDirectory(dirUri);
    
    for (const [name, type] of entries) {
      const entryUri = vscode.Uri.joinPath(dirUri, name);
      
      if (type === vscode.FileType.File) {
        const ext = path.extname(name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          files.push(entryUri);
        }
      } else if (type === vscode.FileType.Directory) {
        // Recursively scan subdirectories
        await scanDirectoryRecursive(entryUri, files);
      }
    }
  } catch (error) {
    // Fallback to fs if workspace.fs fails
    try {
      const dirPath = dirUri.fsPath;
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);
        const entryUri = vscode.Uri.file(entryPath);
        
        if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (SUPPORTED_EXTENSIONS.includes(ext)) {
            files.push(entryUri);
          }
        } else if (entry.isDirectory()) {
          await scanDirectoryRecursive(entryUri, files);
        }
      }
    } catch (fsError) {
      // Silently skip directories we can't read
      console.warn(`Failed to scan directory ${dirUri.fsPath}:`, fsError);
    }
  }
}
