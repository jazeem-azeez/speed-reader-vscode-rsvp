import * as fs from 'fs';
import { FileFormat, StructuredChunk, ChunkType } from './types';

// Pre-compile regex patterns for performance
const CODE_BLOCK_REGEX = /```[\s\S]*?```/g;
const INLINE_CODE_REGEX = /`[^`]+`/g;
const LINK_REGEX = /\[([^\]]+)\]\(.*?\)/g;
const IMAGE_REGEX = /!\[.*?\]\(.*?\)/g;
const HEADER_REGEX = /^(#{1,6})\s+(.+)$/gm;
const LIST_MARKER_REGEX = /(\*|\-|\+|\d+\.)\s/g;
const BLOCKQUOTE_REGEX = /^\>\s*/gm;
const BOLD_ITALIC_REGEX = /(\*|_){1,3}(.+?)\1{1,3}/g;

export function processMarkdown(text: string): string {
  return text
    .replace(CODE_BLOCK_REGEX, '')
    .replace(INLINE_CODE_REGEX, match => match.slice(1, -1))
    .replace(IMAGE_REGEX, '')
    .replace(LINK_REGEX, '$1')
    .replace(HEADER_REGEX, '')
    .replace(LIST_MARKER_REGEX, '')
    .replace(BLOCKQUOTE_REGEX, '')
    .replace(BOLD_ITALIC_REGEX, '$2')
    .replace(/\n\s*\n+/g, '\n')
    .replace(/[^\w\s.,;:!?'"-]/g, '')
    .trim();
}

/**
 * Process markdown text while preserving header hierarchy
 */
export function processMarkdownWithHierarchy(text: string): StructuredChunk[] {
  const chunks: StructuredChunk[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Check for markdown headers
    const headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const headerText = headerMatch[2]
        .replace(LINK_REGEX, '$1')
        .replace(BOLD_ITALIC_REGEX, '$2')
        .replace(/[^\w\s.,;:!?'"-]/g, '')
        .trim();
      
      if (headerText) {
        chunks.push({
          type: 'title',
          level,
          text: headerText,
          pauseAfter: true
        });
      }
      continue;
    }
    
    // Skip code blocks (already processed or will be)
    if (trimmed.startsWith('```')) continue;
    
    // Process regular text lines
    const cleaned = trimmed
      .replace(CODE_BLOCK_REGEX, '')
      .replace(INLINE_CODE_REGEX, match => match.slice(1, -1))
      .replace(IMAGE_REGEX, '')
      .replace(LINK_REGEX, '$1')
      .replace(LIST_MARKER_REGEX, '')
      .replace(BLOCKQUOTE_REGEX, '')
      .replace(BOLD_ITALIC_REGEX, '$2')
      .replace(/[^\w\s.,;:!?'"-]/g, '')
      .trim();
    
    if (cleaned) {
      chunks.push({
        type: 'body',
        text: cleaned
      });
    }
  }
  
  return chunks;
}

/**
 * Detect titles in plain text using heuristics
 */
export function detectPlainTextTitles(text: string): StructuredChunk[] {
  const chunks: StructuredChunk[] = [];
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Heuristic 1: ALL CAPS line (likely a title)
    if (line === line.toUpperCase() && line.length > 3 && /^[A-Z\s]+$/.test(line)) {
      chunks.push({
        type: 'title',
        level: 1,
        text: line,
        pauseAfter: true
      });
      continue;
    }
    
    // Heuristic 2: Line ending with colon (likely a section header)
    if (line.endsWith(':') && line.length < 100 && !line.includes('.') && !line.includes('!') && !line.includes('?')) {
      chunks.push({
        type: 'title',
        level: 2,
        text: line.slice(0, -1), // Remove colon
        pauseAfter: true
      });
      continue;
    }
    
    // Heuristic 3: Line with no lowercase letters and reasonable length
    if (!/[a-z]/.test(line) && line.length > 5 && line.length < 80) {
      chunks.push({
        type: 'title',
        level: 3,
        text: line,
        pauseAfter: true
      });
      continue;
    }
    
    // Regular body text
    const cleaned = line.replace(/[^\w\s.,;:!?'"-]/g, '').trim();
    if (cleaned) {
      chunks.push({
        type: 'body',
        text: cleaned
      });
    }
  }
  
  return chunks;
}

export function chunkText(text: string, wordsPerChunk: number): string[] {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
  }
  return chunks;
}

/**
 * Chunk structured text while preserving hierarchy
 */
export function chunkTextWithHierarchy(structuredChunks: StructuredChunk[], wordsPerChunk: number, pauseDuration: number): StructuredChunk[] {
  const result: StructuredChunk[] = [];
  
  for (const chunk of structuredChunks) {
    if (chunk.type === 'title') {
      // Titles are kept as single chunks, no splitting
      result.push(chunk);
      // Add pause chunk after title
      result.push({
        type: 'pause',
        text: '',
        duration: pauseDuration
      });
    } else if (chunk.type === 'body') {
      // Split body text into word chunks
      const words = chunk.text.split(/\s+/).filter(w => w.length > 0);
      for (let i = 0; i < words.length; i += wordsPerChunk) {
        result.push({
          type: 'body',
          text: words.slice(i, i + wordsPerChunk).join(' ')
        });
      }
    }
    // Pause chunks pass through unchanged
    else if (chunk.type === 'pause') {
      result.push(chunk);
    }
  }
  
  return result;
}

export function addORPHighlight(chunk: string): string {
  const words = chunk.split(' ');
  return words.map(word => {
    if (word.length <= 1) return word;
    const pivot = Math.floor(word.length * 0.38);
    return `<span class="pre-orp">${word.slice(0, pivot)}</span><span class="orp">${word[pivot]}</span><span class="post-orp">${word.slice(pivot + 1)}</span>`;
  }).join(' ');
}

export async function extractText(filePath: string, format: FileFormat): Promise<string> {
  if (format === 'markdown' || format === 'text') {
    // For markdown/text, read directly from file
    const content = fs.readFileSync(filePath, 'utf8');
    if (format === 'markdown') {
      return processMarkdown(content);
    }
    return content;
  }

  if (format === 'pdf') {
    // Lazy load PDF processor
    const pdfProcessor = await import('./pdfProcessor');
    let fullText = '';
    for await (const text of pdfProcessor.extractPdfText(filePath)) {
      fullText += text + ' ';
    }
    return fullText.trim();
  }

  if (format === 'epub') {
    // Lazy load EPUB processor
    const epubProcessor = await import('./epubProcessor');
    let fullText = '';
    for await (const text of epubProcessor.extractEpubText(filePath)) {
      fullText += text + ' ';
    }
    return fullText.trim();
  }

  throw new Error(`Unsupported file format: ${format}`);
}

/**
 * Extract text with hierarchy preserved
 */
export async function extractTextWithHierarchy(filePath: string, format: FileFormat): Promise<StructuredChunk[]> {
  if (format === 'markdown') {
    const content = fs.readFileSync(filePath, 'utf8');
    return processMarkdownWithHierarchy(content);
  }
  
  if (format === 'text') {
    const content = fs.readFileSync(filePath, 'utf8');
    return detectPlainTextTitles(content);
  }

  // For PDF/EPUB, extract as flat text first, then try to detect structure
  // This is a simplified approach - in future could use PDF/EPUB metadata
  if (format === 'pdf' || format === 'epub') {
    const flatText = await extractText(filePath, format);
    // Try plain text title detection as fallback
    return detectPlainTextTitles(flatText);
  }

  throw new Error(`Unsupported file format: ${format}`);
}
