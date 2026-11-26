// Page scroll lock for modal surfaces. The root scrollbar stays in place (hiding it drops its gutter even with
// scrollbar-gutter: stable, and the width change shakes the page); only scroll input on the surface is refused.
const LOCKED = 'is-scroll-locked';

/** Keys that scroll the page; one list for every behavior that reacts to keyboard scrolling. */
export const SCROLL_KEYS: ReadonlySet<string> = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

export const isScrollLocked = () => document.documentElement.classList.contains(LOCKED);

/** Locks page scrolling while `surface` is up; the returned function releases it. */
export function lockScroll(surface: HTMLElement): () => void {
  const input = new AbortController();
  const { signal } = input;
  surface.addEventListener('wheel', event => event.preventDefault(), { passive: false, signal });
  surface.addEventListener('keydown', event => {
    // Space still activates a focused button.
    if (SCROLL_KEYS.has(event.key) && !(event.target as Element).closest('button')) event.preventDefault();
  }, { signal });
  document.documentElement.classList.add(LOCKED);
  return () => {
    input.abort();
    document.documentElement.classList.remove(LOCKED);
  };
}
