// Script-driven motion reads its curves from the CSS tokens, so CSS stays the one place they are tuned.
export const cssToken = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
export const easeOut = () => cssToken('--ease-out', 'ease-out');
