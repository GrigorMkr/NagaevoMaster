import { memo } from 'react';
import classNames from 'classnames';
import { AnimatedEmoji } from '@/components/ui/AnimatedEmoji/AnimatedEmoji';
import type { AnimatedEmojiSize } from '@/components/ui/AnimatedEmoji/AnimatedEmoji';
import { REACTION_BY_ID } from '@/data/reactionIcons';
import { parseMessageParts, type ReactionOnlySize } from '@/utils/messageReactions';
import styles from './MessageRichText.module.css';

interface MessageRichTextProps {
  text: string;
  reactionOnly?: boolean;
  reactionOnlySize?: ReactionOnlySize | null;
}

const REACTION_SIZE: Record<ReactionOnlySize, AnimatedEmojiSize> = {
  one: 'xxl',
  two: 'xl',
  three: 'lg',
  many: 'md',
};

const MessageRichText = memo(function MessageRichText({
  text,
  reactionOnly = false,
  reactionOnlySize = null,
}: MessageRichTextProps) {
  const parts = parseMessageParts(text);
  const inlineSize: AnimatedEmojiSize = reactionOnly && reactionOnlySize
    ? REACTION_SIZE[reactionOnlySize]
    : 'sm';

  return (
    <span
      className={classNames(
        styles.root,
        reactionOnly && styles.reactionOnly,
        reactionOnly && reactionOnlySize && styles[`size_${reactionOnlySize}`],
      )}
    >
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <span key={`text-${index}`} className={styles.text}>{part.value}</span>;
        }

        const reaction = REACTION_BY_ID.get(part.id);
        if (!reaction) {
          return null;
        }

        return (
          <AnimatedEmoji
            key={`reaction-${part.id}-${index}`}
            emoji={reaction.emoji}
            animation={reaction.animation}
            size={inlineSize}
            className={styles.reaction}
          />
        );
      })}
    </span>
  );
});

export {
  MessageRichText,
};
