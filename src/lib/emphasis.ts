// Editorial emphasis only: source text stays escaped, never interpreted as HTML.
export function emphasisParts(text: string) {
  const parts = text.split('**');
  if (parts.length % 2 === 0 || parts.some((part, i) => i % 2 === 1 && !part.trim())) {
    throw new Error('Emphasis requires a non-empty phrase between paired ** markers.');
  }
  return parts.map((text, i) => ({ text, strong: i % 2 === 1 }));
}
export function plainText(text: string) {
  return emphasisParts(text).map(part => part.text).join('');
}
