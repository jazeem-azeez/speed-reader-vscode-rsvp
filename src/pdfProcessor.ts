import pdfParse from 'pdf-parse';
import * as fs from 'fs';

export async function* extractPdfText(filePath: string): AsyncGenerator<string> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    
    if (!pdfData.text || pdfData.text.trim().length === 0) {
      throw new Error('PDF contains no extractable text');
    }
    
    // For now, yield all text at once
    // In future, could be optimized to yield page by page
    yield pdfData.text;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('encrypted') || error.message.includes('password')) {
        throw new Error('PDF is encrypted and cannot be read. Please use an unencrypted PDF.');
      }
      if (error.message.includes('corrupted') || error.message.includes('invalid')) {
        throw new Error('PDF file appears to be corrupted and cannot be read.');
      }
    }
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

