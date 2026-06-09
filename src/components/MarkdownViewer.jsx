import { useRef, useEffect, useMemo } from 'preact/hooks';
import { parseMarkdown, htmlToMarkdown } from '../utils/markdown';
import styles from './MarkdownViewer.module.css';

// Caret position measured as NON-WHITESPACE character distance from the END
// of the document. Two reasons: live-rendering consumes syntax characters
// *before* the caret (e.g. "**bold**" → "bold") so end-distance is the stable
// anchor, and marked's rendered HTML contains pretty-printing newlines
// between tags that become whitespace-only text nodes — counting them (or
// restoring the caret into one) corrupts the position.
const countChars = (s) => s.replace(/\s/g, '').length;

function caretDistanceFromEnd(root) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.endContainer)) return null;
  const tail = document.createRange();
  tail.selectNodeContents(root);
  tail.setStart(range.endContainer, range.endOffset);
  return countChars(tail.toString());
}

function restoreCaretFromEnd(root, distanceFromEnd) {
  const target = Math.max(0, countChars(root.textContent) - distanceFromEnd);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let acc = 0;
  let node;
  while ((node = walker.nextNode())) {
    const text = node.textContent;
    const chars = countChars(text);
    if (chars > 0 && acc + chars >= target) {
      let need = target - acc;
      let offset = 0;
      while (need > 0 && offset < text.length) {
        if (!/\s/.test(text[offset])) need--;
        offset++;
      }
      const range = document.createRange();
      // A transform just completed (e.g. "**bold**" → <strong>bold</strong>)
      // and the caret computes to the very end of the new inline element.
      // Anchor it AFTER the element so continued typing is plain text.
      const INLINE = /^(STRONG|EM|DEL|CODE|A|S|B|I)$/;
      let escape = null;
      if (!text.slice(offset).replace(/\s/g, '')) {
        let cur = node;
        while (
          cur.parentElement &&
          INLINE.test(cur.parentElement.tagName) &&
          !cur.nextSibling
        ) {
          cur = cur.parentElement;
          escape = cur;
        }
      }
      if (escape) {
        range.setStartAfter(escape);
      } else {
        range.setStart(node, offset);
      }
      range.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    acc += chars;
  }
  // No content text node at the target — descend to the deepest last node
  // (skipping whitespace-only text nodes) so the caret can land inside
  // trailing empty elements instead of before them.
  let deepest = root;
  for (;;) {
    let child = deepest.lastChild;
    while (child && child.nodeType === Node.TEXT_NODE && !countChars(child.textContent)) {
      child = child.previousSibling;
    }
    if (!child) break;
    deepest = child;
  }
  const range = document.createRange();
  if (deepest.nodeType === Node.TEXT_NODE) {
    range.setStart(deepest, deepest.textContent.length);
  } else if (deepest.nodeName === 'BR') {
    const parent = deepest.parentNode;
    range.setStart(parent, Array.prototype.indexOf.call(parent.childNodes, deepest));
  } else {
    range.setStart(deepest, 0);
  }
  range.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

// Block-level markdown syntax being typed but not yet followed by content
// ("## ", "- ", "> ", "```"). Rendering at this moment would produce an
// empty element the caret cannot anchor into — wait for real content.
const SYNTAX_ONLY = /^[\s#>*+\-_`~.\d|:[\]()!]*$/;

function caretBlock(root) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;
  const anchor = sel.anchorNode;
  const base = anchor && (anchor.nodeType === 1 ? anchor : anchor.parentElement);
  const block = base && base.closest('p,h1,h2,h3,h4,h5,h6,li,blockquote,pre,td,th,div');
  return block && root.contains(block) && block !== root ? block : null;
}

export function MarkdownViewer({ markdown, externalVersion, onChange }) {
  const ref = useRef(null);
  const current = useRef(markdown);
  const composing = useRef(false);
  const appliedExternal = useRef(0);

  // Rendered once for prerender/hydration; afterwards the contenteditable
  // DOM is the live document and all updates are applied manually so Preact
  // never clobbers user edits or the caret.
  const initialHtml = useMemo(() => parseMarkdown(markdown), []);

  // Rewrite the DOM only for external updates (initial hash load, hashchange
  // navigation), signalled by the version counter. Comparing markdown against
  // `current` is not enough: effects can run with a stale markdown prop
  // mid-typing and would clobber the live DOM.
  useEffect(() => {
    if (externalVersion !== appliedExternal.current && ref.current) {
      appliedExternal.current = externalVersion;
      current.current = markdown;
      ref.current.innerHTML = parseMarkdown(markdown);
    }
  }, [externalVersion, markdown]);

  const handleInput = (e) => {
    if (composing.current) return;
    const el = ref.current;

    // Enter carries inline formatting (em/strong/code) into the new empty
    // block, which would trap everything typed there inside emphasis and
    // keep block syntax like "## " from ever rendering. Strip formatting
    // from a freshly created empty block.
    if (e && e.inputType === 'insertParagraph') {
      const block = caretBlock(el);
      if (block && !block.textContent) {
        block.innerHTML = '<br>';
        const sel = window.getSelection();
        const range = document.createRange();
        range.setStart(block, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    const md = htmlToMarkdown(el.innerHTML);
    current.current = md;
    onChange(md);

    // Re-render only when it changes the visible text — i.e. markdown
    // syntax was completed and should transform. For plain typing the
    // user's DOM (and native undo stack) stays untouched.
    const rendered = parseMarkdown(md);
    const probe = document.createElement('div');
    probe.innerHTML = rendered;
    // Compare ignoring whitespace: serialization trims trailing spaces, and
    // a re-render triggered by a just-typed space would eat it mid-sentence.
    const strip = (s) => s.replace(/\s+/g, '');
    if (strip(probe.textContent) !== strip(el.textContent)) {
      const block = caretBlock(el);
      if (block && SYNTAX_ONLY.test(block.textContent)) return;
      // Defer while the char just typed is inline syntax or whitespace:
      // a half-closed "**bold*" parses as em and would transform too early,
      // and a transform fired BY a trailing space would render it away.
      // The transform lands with the first real character that follows.
      const selNow = window.getSelection();
      if (selNow && selNow.rangeCount) {
        const r = selNow.getRangeAt(0);
        if (r.collapsed && r.startContainer.nodeType === Node.TEXT_NODE) {
          const prev = r.startContainer.textContent[r.startOffset - 1];
          if (prev && /[*_`~\s]/.test(prev)) return;
        }
      }
      const dist = caretDistanceFromEnd(el);
      el.innerHTML = rendered;
      if (dist != null) restoreCaretFromEnd(el, dist);
    }
  };

  return (
    <main class={styles.container}>
      <article
        ref={ref}
        class={styles.viewer}
        contentEditable
        spellcheck={false}
        onInput={handleInput}
        onCompositionStart={() => (composing.current = true)}
        onCompositionEnd={() => {
          composing.current = false;
          handleInput();
        }}
        dangerouslySetInnerHTML={{ __html: initialHtml }}
      />
    </main>
  );
}
