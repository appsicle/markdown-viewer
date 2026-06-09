import { useState, useEffect, useRef } from 'preact/hooks';
import pako from 'pako';
import { TopBar } from './components/TopBar';
import { MarkdownViewer } from './components/MarkdownViewer';
import { sampleMarkdown } from './utils/markdown';

function compressToBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  const compressed = pako.deflateRaw(bytes);
  // Convert to base64url (URL-safe base64)
  let binary = '';
  for (let i = 0; i < compressed.length; i++) {
    binary += String.fromCharCode(compressed[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function decompressFromBase64Url(base64url) {
  try {
    // Convert base64url back to base64
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (base64.length % 4) base64 += '=';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decompressed = pako.inflateRaw(bytes);
    return new TextDecoder().decode(decompressed);
  } catch (e) {
    console.error('Decompression failed:', e);
    return null;
  }
}

function getMarkdownFromHash() {
  if (typeof window === 'undefined') return null;
  const hash = location.hash.slice(1);
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const compressed = params.get('md');
  if (!compressed) return null;
  return decompressFromBase64Url(compressed);
}

function setMarkdownToHash(markdown) {
  if (typeof window === 'undefined') return;
  const compressed = compressToBase64Url(markdown);
  history.replaceState(null, '', `#md=${compressed}`);
}

export function App() {
  // `external` counts updates that did NOT originate from the editor
  // (initial hash load, hashchange navigation). The viewer only rewrites
  // its DOM when this counter moves — inferring external changes from
  // markdown inequality is racy because effects can run with stale props
  // while the user is typing.
  const [doc, setDoc] = useState({ md: sampleMarkdown, external: 0 });
  const initialized = useRef(false);

  // Load from hash on client mount
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const hashMarkdown = getMarkdownFromHash();
      if (hashMarkdown) {
        setDoc({ md: hashMarkdown, external: 1 });
      } else {
        // No hash content, set the sample to URL
        setMarkdownToHash(sampleMarkdown);
      }
    }
  }, []);

  // Sync markdown changes to URL (skip initial render). Debounced — with
  // continuous editing this fires per keystroke, and browsers throttle
  // rapid history.replaceState calls.
  useEffect(() => {
    if (!initialized.current) return;
    const timer = setTimeout(() => setMarkdownToHash(doc.md), 300);
    return () => clearTimeout(timer);
  }, [doc.md]);

  useEffect(() => {
    const handleHashChange = () => {
      const md = getMarkdownFromHash();
      if (md) {
        setDoc((d) => (md !== d.md ? { md, external: d.external + 1 } : d));
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleChange = (md) => setDoc((d) => ({ md, external: d.external }));

  return (
    <>
      <TopBar />
      <MarkdownViewer
        markdown={doc.md}
        externalVersion={doc.external}
        onChange={handleChange}
      />
    </>
  );
}
