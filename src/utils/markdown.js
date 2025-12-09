import { marked } from 'marked';
import DOMPurify from 'dompurify';

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

export const sampleMarkdown = `# Welcome to Markdown Viewer

A beautiful, distraction-free reading experience.

## Features

- **Clean Typography** — Optimized for comfortable reading
- **Dark Mode** — Easy on the eyes at night
- **Fullscreen** — Immersive reading experience

## Getting Started

Click the **Edit** button in the top bar to paste your own markdown content.

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
