/**
 * Returns the character to display inside an avatar circle.
 * If the name starts with an emoji, returns the emoji.
 * Otherwise returns the first letter uppercased.
 */
export function avatarChar(name = '') {
  if (!name) return '?';
  const first = [...name][0];
  return first.codePointAt(0) > 127 ? first : first.toUpperCase();
}
