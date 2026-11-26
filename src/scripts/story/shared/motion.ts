// Script-driven motion reads its curves from the CSS tokens, so CSS stays the one place they are tuned.
export const cssToken = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
export const easeOut = () => cssToken('--ease-out', 'ease-out');
/** A CSS time token (`240ms` or `0.24s`) in milliseconds; a missing token reads as 0, so motion is skipped, never stuck. */
export const cssDuration = (name: string) => {
  const value = cssToken(name, '0ms');
  return parseFloat(value) * (value.endsWith('ms') ? 1 : 1000) || 0;
};
