import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import { EMOJI_CATEGORIES } from './emojiData';
import styles from './EmojiPicker.module.css';

type EmojiCategoryId = (typeof EMOJI_CATEGORIES)[number]['id'];

interface EmojiPickerProps {
  onPick: (emoji: string) => void;
  disabled?: boolean;
}

interface PanelPosition {
  top: number;
  left: number;
}

const PANEL_WIDTH = 296;
const PANEL_HEIGHT = 280;

function computePanelPosition(trigger: DOMRect): PanelPosition {
  const margin = 8;
  const spaceAbove = trigger.top;
  const spaceBelow = window.innerHeight - trigger.bottom;
  const openAbove = spaceAbove >= PANEL_HEIGHT + margin || spaceAbove > spaceBelow;

  const left = Math.min(
    Math.max(margin, trigger.right - PANEL_WIDTH),
    window.innerWidth - PANEL_WIDTH - margin,
  );

  const top = openAbove
    ? Math.max(margin, trigger.top - PANEL_HEIGHT - margin)
    : Math.min(window.innerHeight - PANEL_HEIGHT - margin, trigger.bottom + margin);

  return { top, left };
}

function EmojiPicker({ onPick, disabled }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<EmojiCategoryId>(EMOJI_CATEGORIES[0].id);
  const [burstEmoji, setBurstEmoji] = useState<string | null>(null);
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const updatePanelPosition = () => {
    const trigger = rootRef.current?.getBoundingClientRect();
    if (!trigger) return;
    setPanelPosition(computePanelPosition(trigger));
  };

  useLayoutEffect(() => {
    if (!open) {
      setPanelPosition(null);
      return undefined;
    }
    updatePanelPosition();
    window.addEventListener('resize', updatePanelPosition);
    window.addEventListener('scroll', updatePanelPosition, true);
    return () => {
      window.removeEventListener('resize', updatePanelPosition);
      window.removeEventListener('scroll', updatePanelPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      const panel = document.getElementById(panelId);
      if (panel?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, panelId]);

  const handlePick = (emoji: string) => {
    setBurstEmoji(emoji);
    window.setTimeout(() => setBurstEmoji(null), 420);
    onPick(emoji);
  };

  const category = EMOJI_CATEGORIES.find((item) => item.id === activeCategory)
    ?? EMOJI_CATEGORIES[0];

  const panel = open && panelPosition
    ? createPortal(
      <div
        id={panelId}
        className={styles.panel}
        style={{ top: panelPosition.top, left: panelPosition.left }}
        role="listbox"
        aria-label="Выбор эмодзи"
      >
        <div className={styles.tabs} role="tablist">
          {EMOJI_CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={activeCategory === item.id}
              className={classNames(styles.tab, activeCategory === item.id && styles.tabActive)}
              onClick={() => setActiveCategory(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className={styles.grid}>
          {category.emojis.map((emoji, index) => (
            <button
              key={emoji}
              type="button"
              className={styles.emoji}
              style={{ animationDelay: `${index * 12}ms` }}
              onClick={() => handlePick(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>,
      document.body,
    )
    : null;

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={classNames(styles.trigger, open && styles.triggerOpen)}
        disabled={disabled}
        aria-label="Эмодзи"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {burstEmoji ?? '😊'}
      </button>
      {panel}
    </div>
  );
}

export {
  EmojiPicker,
};
