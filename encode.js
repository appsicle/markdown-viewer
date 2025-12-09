/**
 * Markdown URL Encoder
 * ====================
 * Tiny encoder function to create shareable viewer URLs.
 *
 * Usage (Node.js):
 *   npm install lz-string
 *   node encode.js
 *
 * Usage (Browser):
 *   Include lz-string, then call createShareableURL(markdown)
 */

// For Node.js: npm install lz-string
// const LZString = require('lz-string');

/**
 * Create a shareable URL with compressed markdown
 * @param {string} markdown - Raw markdown content
 * @param {string} baseUrl - Base URL of your viewer (e.g., 'https://example.com/viewer.html')
 * @returns {string} Full URL with compressed markdown in hash
 */
function createShareableURL(markdown, baseUrl = 'https://example.com/viewer.html') {
  // Compress markdown to URL-safe string
  const compressed = LZString.compressToEncodedURIComponent(markdown);

  // Build full URL with hash
  return `${baseUrl}#md=${compressed}`;
}

/**
 * Decode a shareable URL back to markdown
 * @param {string} url - Full shareable URL
 * @returns {string|null} Decompressed markdown or null if invalid
 */
function decodeShareableURL(url) {
  try {
    const hash = new URL(url).hash.slice(1);
    const params = new URLSearchParams(hash);
    const compressed = params.get('md');
    if (!compressed) return null;
    return LZString.decompressFromEncodedURIComponent(compressed);
  } catch (e) {
    return null;
  }
}

// ============================================================
// Example usage
// ============================================================

const sampleMarkdown = `# Hello World

This is a **shareable** markdown document.

## Features
- Compressed in URL hash
- No backend required
- Works anywhere

\`\`\`javascript
console.log('Hello!');
\`\`\`

> Share knowledge freely.
`;

// Uncomment to run in Node.js:
// const LZString = require('lz-string');
// const url = createShareableURL(sampleMarkdown, 'https://yoursite.com/viewer.html');
// console.log('Shareable URL:');
// console.log(url);
// console.log('\nURL length:', url.length, 'characters');

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createShareableURL, decodeShareableURL };
}
