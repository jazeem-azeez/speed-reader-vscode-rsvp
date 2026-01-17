import * as assert from 'assert';
import { chunkText, addORPHighlight, processMarkdown } from '../src/textProcessor';

suite('TextProcessor Tests', () => {
  test('chunkText - basic chunking', () => {
    const text = 'one two three four five six';
    const chunks = chunkText(text, 2);
    assert.strictEqual(chunks.length, 3);
    assert.strictEqual(chunks[0], 'one two');
    assert.strictEqual(chunks[1], 'three four');
    assert.strictEqual(chunks[2], 'five six');
  });

  test('chunkText - single word chunks', () => {
    const text = 'one two three';
    const chunks = chunkText(text, 1);
    assert.strictEqual(chunks.length, 3);
    assert.strictEqual(chunks[0], 'one');
    assert.strictEqual(chunks[1], 'two');
    assert.strictEqual(chunks[2], 'three');
  });

  test('chunkText - empty input', () => {
    const chunks = chunkText('', 2);
    assert.strictEqual(chunks.length, 0);
  });

  test('chunkText - handles multiple spaces', () => {
    const text = 'one    two   three';
    const chunks = chunkText(text, 2);
    assert.strictEqual(chunks.length, 2);
    assert.strictEqual(chunks[0], 'one two');
  });

  test('addORPHighlight - single word', () => {
    const result = addORPHighlight('hello');
    assert(result.includes('<span class="pre-orp">'));
    assert(result.includes('<span class="orp">'));
    assert(result.includes('<span class="post-orp">'));
    assert(result.includes('hello'));
  });

  test('addORPHighlight - multiple words', () => {
    const result = addORPHighlight('hello world');
    assert(result.includes('hello'));
    assert(result.includes('world'));
    assert(result.split('<span class="orp">').length === 3); // 2 words + 1 for split
  });

  test('addORPHighlight - single character word', () => {
    const result = addORPHighlight('a');
    assert.strictEqual(result, 'a');
  });

  test('addORPHighlight - ORP at 38%', () => {
    const result = addORPHighlight('abcdefghij'); // 10 chars, pivot at 3 (38% of 10 = 3.8, floor = 3)
    const orpIndex = result.indexOf('<span class="orp">');
    assert(orpIndex > 0);
    // Check that 'd' (index 3) is the ORP character
    assert(result.includes('<span class="orp">d</span>'));
  });

  test('processMarkdown - removes code blocks', () => {
    const text = 'Some text ```code block``` more text';
    const result = processMarkdown(text);
    assert(!result.includes('code block'));
    assert(result.includes('Some text'));
    assert(result.includes('more text'));
  });

  test('processMarkdown - removes links but keeps text', () => {
    const text = 'Check out [this link](https://example.com) for more info';
    const result = processMarkdown(text);
    assert(!result.includes('https://example.com'));
    assert(result.includes('this link'));
  });

  test('processMarkdown - removes headers', () => {
    const text = '# Header\n## Subheader\nRegular text';
    const result = processMarkdown(text);
    assert(!result.includes('#'));
    assert(result.includes('Regular text'));
  });

  test('processMarkdown - removes images', () => {
    const text = 'Text ![image](path.png) more text';
    const result = processMarkdown(text);
    assert(!result.includes('image'));
    assert(!result.includes('path.png'));
  });
});

