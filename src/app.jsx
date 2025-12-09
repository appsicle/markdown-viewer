import { useState } from 'preact/hooks';
import { TopBar } from './components/TopBar';
import { MarkdownViewer } from './components/MarkdownViewer';
import { PasteDialog } from './components/PasteDialog';
import { sampleMarkdown } from './utils/markdown';

export function App() {
  const [markdown, setMarkdown] = useState(sampleMarkdown);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
