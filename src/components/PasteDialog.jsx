import { useState, useEffect, useRef } from 'preact/hooks';
import { CloseIcon } from './Icons';
import styles from './PasteDialog.module.css';

export function PasteDialog({ isOpen, onClose, markdown, onSave }) {
  const [value, setValue] = useState(markdown);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue(markdown);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, markdown]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div class={styles.overlay} onClick={handleOverlayClick}>
      <div class={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div class={styles.header}>
          <h2 id="dialog-title" class={styles.headerTitle}>Edit Markdown</h2>
          <button
            class={styles.closeButton}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <CloseIcon size={18} />
          </button>
        </div>
        <textarea
          ref={textareaRef}
          class={styles.textarea}
          value={value}
          onInput={(e) => setValue(e.target.value)}
          placeholder="Paste your markdown here..."
          spellcheck={false}
        />
        <div class={styles.footer}>
          <button class={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button class={styles.saveButton} onClick={handleSave}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
