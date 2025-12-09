import { useTheme } from '../context/ThemeContext';
import { useFullscreen } from '../hooks/useFullscreen';
import { SunIcon, MoonIcon, ExpandIcon, ShrinkIcon, EditIcon } from './Icons';
import styles from './TopBar.module.css';

export function TopBar({ onOpenDialog }) {
  const { theme, toggleTheme } = useTheme();
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  return (
    <header class={styles.topbar}>
      <div class={styles.title}>Markdown Viewer</div>
      <div class={styles.actions}>
        <button
          class={styles.iconButton}
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          title={theme === 'light' ? 'Dark mode' : 'Light mode'}
        >
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>
        <button
          class={styles.iconButton}
          onClick={onOpenDialog}
          aria-label="Edit markdown"
          title="Edit markdown"
        >
          <EditIcon />
        </button>
        <button
          class={styles.iconButton}
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <ShrinkIcon /> : <ExpandIcon />}
        </button>
      </div>
    </header>
  );
}
