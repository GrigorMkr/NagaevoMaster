import twemoji from '@twemoji/api';

const TWEMOJI_VERSION = '17.0.2';
const TWEMOJI_CDN = `https://cdn.jsdelivr.net/gh/jdecked/twemoji@${TWEMOJI_VERSION}/assets/svg`;

function emojiCodepoint(emoji: string): string {
  return twemoji.convert.toCodePoint(emoji);
}

function emojiCodepointCandidates(emoji: string): string[] {
  const primary = emojiCodepoint(emoji);
  const stripped = primary.replace(/-fe0f/g, '');
  return stripped === primary ? [primary] : [stripped, primary];
}

function emojiSvgLocalUrl(emoji: string): string {
  const [first] = emojiCodepointCandidates(emoji);
  return `/emoji/${first}.svg`;
}

function emojiSvgCdnUrl(emoji: string): string {
  const [first] = emojiCodepointCandidates(emoji);
  return `${TWEMOJI_CDN}/${first}.svg`;
}

function emojiSvgFallbackUrls(emoji: string): string[] {
  return emojiCodepointCandidates(emoji).flatMap((codepoint) => [
    `/emoji/${codepoint}.svg`,
    `${TWEMOJI_CDN}/${codepoint}.svg`,
  ]);
}

export {
  TWEMOJI_VERSION,
  emojiCodepoint,
  emojiCodepointCandidates,
  emojiSvgLocalUrl,
  emojiSvgCdnUrl,
  emojiSvgFallbackUrls,
};
