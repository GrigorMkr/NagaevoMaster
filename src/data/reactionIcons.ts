type EmojiAnimation = 'bob' | 'bounce' | 'pulse' | 'wiggle' | 'shake' | 'wave' | 'none';

interface ReactionIcon {
  id: string;
  emoji: string;
  animation?: EmojiAnimation;
}

interface ReactionCategory {
  id: string;
  tabEmoji: string;
  items: ReactionIcon[];
}

function reaction(id: string, emoji: string, animation: EmojiAnimation = 'bob'): ReactionIcon {
  return { id, emoji, animation };
}

const REACTION_CATEGORIES: ReactionCategory[] = [
  {
    id: 'smile',
    tabEmoji: '😊',
    items: [
      reaction('smile', '😊'),
      reaction('grin', '😄', 'bounce'),
      reaction('wink', '😉', 'wiggle'),
      reaction('love', '🥰', 'pulse'),
      reaction('heart-eyes', '😍', 'pulse'),
      reaction('star-struck', '🤩', 'wiggle'),
      reaction('kiss', '😘', 'bounce'),
      reaction('cool', '😎'),
      reaction('party', '🥳', 'bounce'),
      reaction('yum', '😋', 'wiggle'),
      reaction('silly', '🤪', 'wiggle'),
      reaction('money', '🤑', 'pulse'),
      reaction('hug', '🤗', 'pulse'),
      reaction('think', '🤔'),
      reaction('zip', '🤐', 'none'),
      reaction('smirk', '😏', 'wiggle'),
    ],
  },
  {
    id: 'mood',
    tabEmoji: '😢',
    items: [
      reaction('sad', '😢', 'bob'),
      reaction('cry', '😭', 'shake'),
      reaction('angry', '😠', 'shake'),
      reaction('rage', '😡', 'shake'),
      reaction('scared', '😱', 'shake'),
      reaction('sweat', '😰', 'wiggle'),
      reaction('pleading', '🥺', 'pulse'),
      reaction('sleep', '😴', 'bob'),
      reaction('sick', '🤢', 'shake'),
      reaction('dizzy', '😵', 'wiggle'),
      reaction('see-no', '🙈', 'wiggle'),
      reaction('skull', '💀', 'none'),
    ],
  },
  {
    id: 'gesture',
    tabEmoji: '👍',
    items: [
      reaction('thumbs-up', '👍', 'bounce'),
      reaction('thumbs-down', '👎', 'shake'),
      reaction('ok', '👌', 'pulse'),
      reaction('peace', '✌️', 'wiggle'),
      reaction('wave', '👋', 'wave'),
      reaction('clap', '👏', 'bounce'),
      reaction('pray', '🙏', 'pulse'),
      reaction('strong', '💪', 'pulse'),
      reaction('fist', '✊', 'shake'),
      reaction('point-up', '☝️', 'bounce'),
      reaction('point-right', '👉', 'wiggle'),
      reaction('salute', '🫡', 'wave'),
    ],
  },
  {
    id: 'heart',
    tabEmoji: '❤️',
    items: [
      reaction('heart-red', '❤️', 'pulse'),
      reaction('heart-orange', '🧡', 'pulse'),
      reaction('heart-yellow', '💛', 'pulse'),
      reaction('heart-green', '💚', 'pulse'),
      reaction('heart-blue', '💙', 'pulse'),
      reaction('heart-purple', '💜', 'pulse'),
      reaction('heart-broken', '💔', 'shake'),
      reaction('hearts', '💕', 'pulse'),
      reaction('sparkle-heart', '💖', 'bounce'),
      reaction('rose', '🌹', 'bob'),
      reaction('blossom', '🌸', 'wiggle'),
    ],
  },
  {
    id: 'fun',
    tabEmoji: '🎉',
    items: [
      reaction('tada', '🎉', 'bounce'),
      reaction('balloon', '🎈', 'bob'),
      reaction('gift', '🎁', 'bounce'),
      reaction('cake', '🎂', 'pulse'),
      reaction('fire', '🔥', 'wiggle'),
      reaction('glow-star', '⭐', 'wiggle'),
      reaction('sparkle', '✨', 'pulse'),
      reaction('bolt', '⚡', 'shake'),
      reaction('trophy', '🏆', 'bounce'),
      reaction('hundred', '💯', 'pulse'),
      reaction('bell-ring', '🔔', 'wiggle'),
      reaction('eyes', '👀', 'wiggle'),
    ],
  },
  {
    id: 'food',
    tabEmoji: '☕',
    items: [
      reaction('apple', '🍎', 'bob'),
      reaction('pizza', '🍕'),
      reaction('burger', '🍔', 'bounce'),
      reaction('fries', '🍟'),
      reaction('noodles', '🍜', 'wiggle'),
      reaction('cake-slice', '🍰', 'pulse'),
      reaction('coffee', '☕', 'bob'),
      reaction('beer', '🍺', 'bob'),
      reaction('wine', '🍷', 'bob'),
      reaction('egg', '🥚', 'wiggle'),
    ],
  },
  {
    id: 'life',
    tabEmoji: '🏡',
    items: [
      reaction('house', '🏡'),
      reaction('tools', '🔨', 'shake'),
      reaction('wrench-tool', '🔧', 'wiggle'),
      reaction('car-drive', '🚗', 'bob'),
      reaction('tractor-field', '🚜', 'bob'),
      reaction('truck-load', '🚚', 'bob'),
      reaction('leaf', '🌿', 'wiggle'),
      reaction('dog', '🐕', 'bounce'),
      reaction('cat', '🐈', 'bob'),
      reaction('chat', '💬', 'pulse'),
      reaction('phone-call', '📞', 'wiggle'),
      reaction('email', '📧'),
      reaction('pin-map', '📍', 'bounce'),
      reaction('time', '⏰', 'wiggle'),
      reaction('coins', '💰', 'pulse'),
      reaction('sun-day', '☀️', 'wiggle'),
      reaction('rain', '🌧️', 'bob'),
      reaction('night', '🌙', 'bob'),
    ],
  },
];

const REACTION_BY_ID = new Map<string, ReactionIcon>();
const REACTION_BY_LEGACY = new Map<string, ReactionIcon>();

for (const category of REACTION_CATEGORIES) {
  for (const item of category.items) {
    REACTION_BY_ID.set(item.id, item);
    REACTION_BY_LEGACY.set(item.emoji, item);
    REACTION_BY_LEGACY.set(item.emoji.replace(/\uFE0F/g, ''), item);
  }
}

const ALL_REACTIONS = REACTION_CATEGORIES.flatMap((category) => category.items);

const ALL_REACTION_EMOJIS = [...new Set(ALL_REACTIONS.map((item) => item.emoji))];

function reactionToken(id: string): string {
  return `:${id}:`;
}

function isReactionToken(value: string): boolean {
  return REACTION_BY_ID.has(value);
}

export {
  REACTION_CATEGORIES,
  REACTION_BY_ID,
  REACTION_BY_LEGACY,
  ALL_REACTIONS,
  ALL_REACTION_EMOJIS,
  reactionToken,
  isReactionToken,
};

export type {
  ReactionIcon,
  ReactionCategory,
  EmojiAnimation,
};
