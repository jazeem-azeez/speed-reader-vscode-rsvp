import * as fs from 'fs';
import { FileFormat } from './types';

// Pre-compile regex patterns for performance
const CODE_BLOCK_REGEX = /```[\s\S]*?```/g;
const INLINE_CODE_REGEX = /`[^`]+`/g;
const LINK_REGEX = /\[([^\]]+)\]\(.*?\)/g;
const IMAGE_REGEX = /!\[.*?\]\(.*?\)/g;
const HEADER_REGEX = /^#{1,6}\s*/gm;
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

export function chunkText(text: string, wordsPerChunk: number): string[] {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
  }
  return chunks;
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

