import { marked } from 'marked';
import DOMPurify from 'dompurify';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

marked.setOptions({
  gfm: true,
  breaks: true,
});

export function parseMarkdown(markdown) {
  const rawHtml = marked.parse(markdown);

  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(rawHtml, {
      ADD_ATTR: ['target'],
    });
  }

  return rawHtml;
}

let turndown;

// Serialize the live contenteditable DOM back to markdown source.
export function htmlToMarkdown(html) {
  if (!turndown) {
    turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      hr: '---',
      bulletListMarker: '-',
      emDelimiter: '*',
    });
    turndown.use(gfm);
  }
  const md = turndown.turndown(html);
  // Turndown escapes markdown syntax characters it finds in plain text
  // (\*\*bold\*\*). Unescape them so syntax the user types goes live.
  return md.replace(/\\([\\`*_{}[\]()#+\-.!>~|=])/g, '$1');
}

export const sampleMarkdown = `# Welcome to Markdown Viewer

A beautiful, distraction-free reading experience.

## Features

- **Clean Typography** — Optimized for comfortable reading
- **Dark Mode** — Easy on the eyes at night
- **Fullscreen** — Immersive reading experience

## Getting Started

This page **is** the editor — click anywhere and just type. Try typing some \`markdown syntax\` and watch it render the moment you complete it.

---

## Markdown Examples

### Text Formatting

You can write **bold text**, *italic text*, or ***both***. You can also use ~~strikethrough~~ and \`inline code\`.

### Links and Images

Here's a [link to Preact](https://preactjs.com), the framework powering this viewer.

### Blockquotes

> "The best interface is no interface."
> — Golden Krishna

### Code Blocks

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));
\`\`\`

### Lists

#### Unordered List
- First item
- Second item
  - Nested item
  - Another nested item
- Third item

#### Ordered List
1. First step
2. Second step
3. Third step

### Tables

| Feature | Status |
|---------|--------|
| Markdown Parsing | Done |
| Dark Mode | Done |
| Fullscreen | Done |

### Horizontal Rule

---

*Enjoy your reading!*
`;
