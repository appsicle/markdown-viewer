import { useState, useEffect, useRef } from 'preact/hooks';
import LZString from 'lz-string';
import { TopBar } from './components/TopBar';
import { MarkdownViewer } from './components/MarkdownViewer';
import { PasteDialog } from './components/PasteDialog';
import { sampleMarkdown } from './utils/markdown';

function getMarkdownFromHash() {
  if (typeof window === 'undefined') return null;
  const hash = location.hash.slice(1);
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const compressed = params.get('md');
  if (!compressed) return null;
  return LZString.decompressFromEncodedURIComponent(compressed);
}

function setMarkdownToHash(markdown) {
  if (typeof window === 'undefined') return;
  const compressed = LZString.compressToEncodedURIComponent(markdown);
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
