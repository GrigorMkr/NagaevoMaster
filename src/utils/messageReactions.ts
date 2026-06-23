import { REACTION_BY_ID, REACTION_BY_LEGACY } from '@/data/reactionIcons';

const TOKEN_RE = /:([a-z][a-z0-9-]*):/g;

const EMOJI_GRAPHEME =
  /\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)*/gu;

type MessagePart =
  | { type: 'text'; value: string }
  | { type: 'reaction'; id: string };

type ReactionOnlySize = 'one' | 'two' | 'three' | 'many';

function parseMessageParts(text: string): MessagePart[] {
  const parts: MessagePart[] = [];
  const pattern = new RegExp(`${TOKEN_RE.source}|${EMOJI_GRAPHEME.source}`, 'gu');
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, index) });
    }

    const tokenId = match[1];
    const emoji = match[0];
    if (tokenId && REACTION_BY_ID.has(tokenId)) {
      parts.push({ type: 'reaction', id: tokenId });
    } else if (REACTION_BY_LEGACY.has(emoji)) {
      parts.push({ type: 'reaction', id: REACTION_BY_LEGACY.get(emoji)!.id });
    } else if (emoji) {
      parts.push({ type: 'text', value: emoji });
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
}

function countReactions(text: string): number {
  return parseMessageParts(text).filter((part) => part.type === 'reaction').length;
}

function isReactionOnlyMessage(text: string): boolean {
  const parts = parseMessageParts(text.trim());
  if (parts.length === 0) {
    return false;
  }
  return parts.every((part) => part.type === 'reaction');
}

function getReactionOnlySize(text: string): ReactionOnlySize {
  const count = countReactions(text.trim());
  if (count <= 1) return 'one';
  if (count === 2) return 'two';
  if (count === 3) return 'three';
  return 'many';
}

export {
  parseMessageParts,
  countReactions,
  isReactionOnlyMessage,
  getReactionOnlySize,
};

export type {
  MessagePart,
  ReactionOnlySize,
};
