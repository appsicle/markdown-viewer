import { useMemo } from 'preact/hooks';
import { parseMarkdown } from '../utils/markdown';
import styles from './MarkdownViewer.module.css';

export function MarkdownViewer({ markdown }) {
  const html = useMemo(() => parseMarkdown(markdown), [markdown]);

  return (
    <main class={styles.container}>
      <article
        class={styles.viewer}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </main>
  );
}
