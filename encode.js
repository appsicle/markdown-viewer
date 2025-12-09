/**
 * Markdown URL Encoder
 * ====================
 * Encoder function to create shareable viewer URLs using pako deflate.
 *
 * Usage (Node.js):
 *   npm install pako
 *   node encode.js
 *
 * Usage (Browser):
 *   Include pako, then call createShareableURL(markdown)
 */

// For Node.js: npm install pako
// const pako = require('pako');

/**
 * Compress string to base64url using deflate
 */
function compressToBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  const compressed = pako.deflateRaw(bytes);
  let binary = '';
  for (let i = 0; i < compressed.length; i++) {
    binary += String.fromCharCode(compressed[i]);
  }
  // Use Buffer in Node.js, btoa in browser
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(compressed).toString('base64url');
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Decompress base64url back to string
 */
function decompressFromBase64Url(base64url) {
  try {
    let bytes;
    if (typeof Buffer !== 'undefined') {
      bytes = new Uint8Array(Buffer.from(base64url, 'base64url'));
    } else {
      let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      const binary = atob(base64);
      bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
    }
    const decompressed = pako.inflateRaw(bytes);
    return new TextDecoder().decode(decompressed);
  } catch (e) {
    return null;
  }
}

/**
 * Create a shareable URL with compressed markdown
 * @param {string} markdown - Raw markdown content
 * @param {string} baseUrl - Base URL of your viewer
 * @returns {string} Full URL with compressed markdown in hash
 */
function createShareableURL(markdown, baseUrl = 'https://example.com/viewer.html') {
  const compressed = compressToBase64Url(markdown);
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
    return decompressFromBase64Url(compressed);
  } catch (e) {
    return null;
  }
}

// ============================================================
// Example usage (Node.js)
// ============================================================

const sampleMarkdown = `# Hello World

This is a **shareable** markdown document.

## Features
- Compressed with deflate (pako)
- ~20-30% smaller URLs than lz-string
- No backend required

\`\`\`javascript
console.log('Hello!');
\`\`\`

> Share knowledge freely.
`;

// Run with: node encode.js
if (typeof require !== 'undefined' && require.main === module) {
  const pako = require('pako');
  global.pako = pako;

  const url = createShareableURL(sampleMarkdown, 'https://yoursite.com/viewer.html');
  console.log('Sample markdown length:', sampleMarkdown.length);
  console.log('Compressed URL length:', url.length);
  console.log('Compression ratio:', ((url.length - 40) / sampleMarkdown.length * 100).toFixed(1) + '%');
  console.log('\nShareable URL:');
  console.log(url);
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createShareableURL, decodeShareableURL, compressToBase64Url, decompressFromBase64Url };
}
