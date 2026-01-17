import * as path from 'path';
import { FileFormat } from './types';

export function detectFormat(filePath: string): FileFormat {
  const ext = path.extname(filePath).toLowerCase();
  const formatMap: Record<string, FileFormat> = {
    '.md': 'markdown',
    '.markdown': 'markdown',
    '.txt': 'text',
    '.pdf': 'pdf',
    '.epub': 'epub'
  };
  return formatMap[ext] || 'text';
}

