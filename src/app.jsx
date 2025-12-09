import { useState, useEffect, useRef } from 'preact/hooks';
import pako from 'pako';
import { TopBar } from './components/TopBar';
import { MarkdownViewer } from './components/MarkdownViewer';
import { PasteDialog } from './components/PasteDialog';
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
  const [markdown, setMarkdown] = useState(sampleMarkdown);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const initialized = useRef(false);

  // Load from hash on client mount
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const hashMarkdown = getMarkdownFromHash();
      if (hashMarkdown) {
        setMarkdown(hashMarkdown);
      } else {
        // No hash content, set the sample to URL
        setMarkdownToHash(sampleMarkdown);
      }
    }
  }, []);

  // Sync markdown changes to URL (skip initial render)
  useEffect(() => {
    if (initialized.current) {
      setMarkdownToHash(markdown);
    }
  }, [markdown]);

  useEffect(() => {
    const handleHashChange = () => {
      const md = getMarkdownFromHash();
      if (md && md !== markdown) {
        setMarkdown(md);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [markdown]);

  return (
    <>
      <TopBar onOpenDialog={() => setIsDialogOpen(true)} />
      <MarkdownViewer markdown={markdown} />
      <PasteDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        markdown={markdown}
        onSave={setMarkdown}
      />
    </>
  );
}
