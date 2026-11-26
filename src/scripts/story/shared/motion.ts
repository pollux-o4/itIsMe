// Script-driven motion reads its curves from the CSS tokens, so CSS stays the one place they are tuned.
// Read from body: story tokens live on .story-body, and body still inherits the :root ones.
export const cssToken = (name: string, fallback: string) =>
  getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;
export const easeOut = () => cssToken('--ease-out', 'ease-out');
/** A CSS time token (`240ms` or `0.24s`) in milliseconds; a missing token reads as 0, so motion is skipped, never stuck. */
export const cssDuration = (name: string) => {
  const value = cssToken(name, '0ms');
  return parseFloat(value) * (value.endsWith('ms') ? 1 : 1000) || 0;
};

/** A CSS `cubic-bezier()` token as a progress function; Newton steps solve x(s) = t, so motion matches CSS. */
export const cssEasing = (name: string): ((t: number) => number) => {
  const [x1, y1, x2, y2] = (cssToken(name, '').match(/-?[\d.]+/g) ?? []).map(Number);
  if ([x1, y1, x2, y2].some(Number.isNaN) || x1 === undefined) return t => t;
  const axis = (a: number, b: number) => (s: number) => ((1 - 3 * b + 3 * a) * s + (3 * b - 6 * a)) * s * s + 3 * a * s;
  const [x, y] = [axis(x1, x2), axis(y1, y2)];
  const slope = (s: number) => (3 * (1 - 3 * x2 + 3 * x1) * s + 2 * (3 * x2 - 6 * x1)) * s + 3 * x1;
  return t => {
    let s = t;
    for (let i = 0; i < 6; i += 1) {
      const d = slope(s);
      if (Math.abs(d) < 1e-6) break;
      s -= (x(s) - t) / d;
    }
    return y(Math.min(1, Math.max(0, s)));
  };
};
