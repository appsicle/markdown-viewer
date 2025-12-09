import { useState, useEffect } from 'preact/hooks';
import LZString from 'lz-string';
import { TopBar } from './components/TopBar';
import { MarkdownViewer } from './components/MarkdownViewer';
import { PasteDialog } from './components/PasteDialog';
import { sampleMarkdown } from './utils/markdown';

function getMarkdownFromHash() {
  const hash = location.hash.slice(1);
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const compressed = params.get('md');
  if (!compressed) return null;
  return LZString.decompressFromEncodedURIComponent(compressed);
}

function setMarkdownToHash(markdown) {
  const compressed = LZString.compressToEncodedURIComponent(markdown);
  history.replaceState(null, '', `#md=${compressed}`);
}

export function App() {
  const [markdown, setMarkdown] = useState(() => {
    return getMarkdownFromHash() || sampleMarkdown;
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setMarkdownToHash(markdown);
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
