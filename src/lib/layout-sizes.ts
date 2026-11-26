// `sizes` cannot read CSS variables, so the layout tokens it needs are mirrored here once.
// Keep in step with --gutter, --gap and --shell-max in styles/story/tokens.css.
export const GUTTER = 'clamp(16px, 4vw, 56px)';
export const GAP = 'clamp(12px, 1.8vw, 28px)';
export const FRAME_PAD = 'clamp(24px, min(3vw, 4.8svh), 48px)';
/** Content width of `.shell`. */
export const SHELL = `(min(100vw, 1240px) - 2 * ${GUTTER})`;
/** Width of `span` columns in a grid of `columns` separated by GAP. */
export const columns = (span: number, of: number, width = SHELL) =>
  `((${width} * ${span} - ${of - span} * ${GAP}) / ${of})`;
