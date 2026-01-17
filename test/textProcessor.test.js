"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const textProcessor_1 = require("../src/textProcessor");
suite('TextProcessor Tests', () => {
    test('chunkText - basic chunking', () => {
        const text = 'one two three four five six';
        const chunks = (0, textProcessor_1.chunkText)(text, 2);
        assert.strictEqual(chunks.length, 3);
        assert.strictEqual(chunks[0], 'one two');
        assert.strictEqual(chunks[1], 'three four');
        assert.strictEqual(chunks[2], 'five six');
    });
    test('chunkText - single word chunks', () => {
        const text = 'one two three';
        const chunks = (0, textProcessor_1.chunkText)(text, 1);
        assert.strictEqual(chunks.length, 3);
        assert.strictEqual(chunks[0], 'one');
        assert.strictEqual(chunks[1], 'two');
        assert.strictEqual(chunks[2], 'three');
    });
    test('chunkText - empty input', () => {
        const chunks = (0, textProcessor_1.chunkText)('', 2);
        assert.strictEqual(chunks.length, 0);
    });
    test('chunkText - handles multiple spaces', () => {
        const text = 'one    two   three';
        const chunks = (0, textProcessor_1.chunkText)(text, 2);
        assert.strictEqual(chunks.length, 2);
        assert.strictEqual(chunks[0], 'one two');
    });
    test('addORPHighlight - single word', () => {
        const result = (0, textProcessor_1.addORPHighlight)('hello');
        assert(result.includes('<span class="pre-orp">'));
        assert(result.includes('<span class="orp">'));
        assert(result.includes('<span class="post-orp">'));
        assert(result.includes('hello'));
    });
    test('addORPHighlight - multiple words', () => {
        const result = (0, textProcessor_1.addORPHighlight)('hello world');
        assert(result.includes('hello'));
        assert(result.includes('world'));
        assert(result.split('<span class="orp">').length === 3); // 2 words + 1 for split
    });
    test('addORPHighlight - single character word', () => {
        const result = (0, textProcessor_1.addORPHighlight)('a');
        assert.strictEqual(result, 'a');
    });
    test('addORPHighlight - ORP at 38%', () => {
        const result = (0, textProcessor_1.addORPHighlight)('abcdefghij'); // 10 chars, pivot at 3 (38% of 10 = 3.8, floor = 3)
        const orpIndex = result.indexOf('<span class="orp">');
        assert(orpIndex > 0);
        // Check that 'd' (index 3) is the ORP character
        assert(result.includes('<span class="orp">d</span>'));
    });
    test('processMarkdown - removes code blocks', () => {
        const text = 'Some text ```code block``` more text';
        const result = (0, textProcessor_1.processMarkdown)(text);
        assert(!result.includes('code block'));
        assert(result.includes('Some text'));
        assert(result.includes('more text'));
    });
    test('processMarkdown - removes links but keeps text', () => {
        const text = 'Check out [this link](https://example.com) for more info';
        const result = (0, textProcessor_1.processMarkdown)(text);
        assert(!result.includes('https://example.com'));
        assert(result.includes('this link'));
    });
    test('processMarkdown - removes headers', () => {
        const text = '# Header\n## Subheader\nRegular text';
        const result = (0, textProcessor_1.processMarkdown)(text);
        assert(!result.includes('#'));
        assert(result.includes('Regular text'));
    });
    test('processMarkdown - removes images', () => {
        const text = 'Text ![image](path.png) more text';
        const result = (0, textProcessor_1.processMarkdown)(text);
        assert(!result.includes('image'));
        assert(!result.includes('path.png'));
    });
});
//# sourceMappingURL=textProcessor.test.js.map