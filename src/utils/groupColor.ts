/** Simple deterministic string hash (djb2-ish), used to pick a stable per-group hue. */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export interface GroupColors {
  background: string;
  text: string;
  textMuted: string;
}

/**
 * Pale, high-lightness background paired with fixed dark text so contrast stays strong
 * regardless of hue or the app's light/dark theme.
 */
export function getGroupColors(id: string): GroupColors {
  const hue = hashString(id) % 360;
  return {
    background: `hsl(${hue}, 62%, 88%)`,
    text: '#1f2430',
    textMuted: 'rgba(31, 36, 48, 0.62)',
  };
}
