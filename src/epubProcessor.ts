// epubjs uses CommonJS require syntax
// We'll use dynamic import to handle it properly
export async function* extractEpubText(filePath: string): AsyncGenerator<string> {
  try {
    // Dynamic import for epubjs (CommonJS module)
    const epubjs = await import('epubjs');
    const EPub = (epubjs as any).default || epubjs;
    
    const book = EPub(filePath);
    await book.opened;
    
    const spine = await book.loadSpine();
    
    for (const item of spine.spineItems) {
      try {
        const section = await book.load(item.id);
        // epubjs returns a document-like object
        // Try different methods to extract text
        let text = '';
        if (section.text) {
          text = section.text;
        } else if (section.querySelector) {
          const body = section.querySelector('body');
          text = body ? (body.textContent || '') : '';
        } else if (typeof section === 'string') {
          text = section;
        }
        
        // Clean up whitespace
        const cleaned = text.replace(/\s+/g, ' ').trim();
        if (cleaned.length > 0) {
          yield cleaned;
        }
      } catch (sectionError) {
        // Skip sections that fail to load, continue with next
        continue;
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('corrupted') || error.message.includes('invalid')) {
        throw new Error('EPUB file appears to be corrupted and cannot be read.');
      }
      if (error.message.includes('not found') || error.message.includes('missing')) {
        throw new Error('EPUB file structure is invalid or incomplete.');
      }
    }
    throw new Error(`Failed to extract text from EPUB: ${error instanceof Error ? error.message : String(error)}`);
  }
}

