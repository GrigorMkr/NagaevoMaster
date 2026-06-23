import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import { AnimatedEmoji } from '@/components/ui/AnimatedEmoji/AnimatedEmoji';
import { ToolbarIcon } from '@/components/ui/ToolbarIcon';
import {
  REACTION_CATEGORIES,
  REACTION_BY_ID,
  reactionToken,
  type ReactionIcon,
} from '@/data/reactionIcons';
import styles from './EmojiPicker.module.css';

type ReactionCategoryId = (typeof REACTION_CATEGORIES)[number]['id'] | 'recent';

interface EmojiPickerProps {
  onPick: (token: string) => void;
  disabled?: boolean;
}

interface PanelPosition {
  top: number;
  left: number;
}

const PANEL_WIDTH = 296;
const PANEL_HEIGHT = 280;
const RECENT_KEY = 'nagaevo-recent-reactions';
const MAX_RECENT = 24;

function loadRecentReactionIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string' && REACTION_BY_ID.has(item));
  } catch {
    return [];
  }
}

function rememberRecentReaction(id: string) {
  const next = [id, ...loadRecentReactionIds().filter((item) => item !== id)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

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

function ReactionButton({
  reaction,
  index,
  onPick,
}: {
  reaction: ReactionIcon;
  index: number;
  onPick: (reaction: ReactionIcon) => void;
}) {
  return (
    <button
      type="button"
      className={styles.reactionBtn}
      style={{ animationDelay: `${index * 12}ms` }}
      aria-label={reaction.emoji}
      onClick={() => onPick(reaction)}
    >
      <AnimatedEmoji
        emoji={reaction.emoji}
        animation={reaction.animation}
        size="md"
      />
    </button>
  );
}

function EmojiPicker({ onPick, disabled }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ReactionCategoryId>(
    REACTION_CATEGORIES[0]?.id ?? 'smile',
  );
  const [recentIds, setRecentIds] = useState<string[]>(() => loadRecentReactionIds());
  const [burstReaction, setBurstReaction] = useState<ReactionIcon | null>(null);
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
    const recent = loadRecentReactionIds();
    setRecentIds(recent);
    if (activeCategory === 'recent' && recent.length === 0) {
      setActiveCategory(REACTION_CATEGORIES[0]?.id ?? 'smile');
    }
    updatePanelPosition();
    window.addEventListener('resize', updatePanelPosition);
    window.addEventListener('scroll', updatePanelPosition, true);
    return () => {
      window.removeEventListener('resize', updatePanelPosition);
      window.removeEventListener('scroll', updatePanelPosition, true);
    };
  }, [open, activeCategory]);

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

  const handlePick = (reaction: ReactionIcon) => {
    setBurstReaction(reaction);
    window.setTimeout(() => setBurstReaction(null), 420);
    rememberRecentReaction(reaction.id);
    setRecentIds(loadRecentReactionIds());
    onPick(reactionToken(reaction.id));
  };

  const category = activeCategory === 'recent'
    ? null
    : REACTION_CATEGORIES.find((item) => item.id === activeCategory) ?? REACTION_CATEGORIES[0];

  const visibleReactions = activeCategory === 'recent'
    ? recentIds.map((id) => REACTION_BY_ID.get(id)).filter((item): item is ReactionIcon => Boolean(item))
    : category?.items ?? [];

  const panel = open && panelPosition
    ? createPortal(
      <div
        id={panelId}
        className={styles.panel}
        style={{ top: panelPosition.top, left: panelPosition.left }}
        role="listbox"
        aria-label="Выбор реакций"
      >
        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'recent'}
            className={classNames(styles.tab, activeCategory === 'recent' && styles.tabActive)}
            onClick={() => setActiveCategory('recent')}
          >
            <ToolbarIcon name="clock" accent="#9ec8d8" />
          </button>
          {REACTION_CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={activeCategory === item.id}
              className={classNames(styles.tab, activeCategory === item.id && styles.tabActive)}
              onClick={() => setActiveCategory(item.id)}
            >
              <AnimatedEmoji emoji={item.tabEmoji} animation="none" size="sm" />
            </button>
          ))}
        </div>
        <div className={styles.grid}>
          {visibleReactions.length === 0 ? (
            <p className={styles.emptyRecent}>Недавние реакции появятся здесь</p>
          ) : (
            visibleReactions.map((reaction, index) => (
              <ReactionButton
                key={`${activeCategory}-${reaction.id}`}
                reaction={reaction}
                index={index}
                onPick={handlePick}
              />
            ))
          )}
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
        aria-label="Реакции"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {burstReaction ? (
          <AnimatedEmoji
            emoji={burstReaction.emoji}
            animation={burstReaction.animation ?? 'bounce'}
            size="sm"
            className={styles.triggerBurst}
          />
        ) : (
          <AnimatedEmoji emoji="😊" animation="bob" size="sm" />
        )}
      </button>
      {panel}
    </div>
  );
}

export {
  EmojiPicker,
};
