import { reducedMotion } from './media';
import { cssDuration, cssEasing } from './motion';
import { SCROLL_KEYS } from './scroll-lock';

// Escape also ends a pending anchor scroll.
const STOP_KEYS = new Set([...SCROLL_KEYS, 'Escape']);

/**
 * Scrolls to an element over `--scroll-duration` on `--ease-in-out`. The destination is re-read every frame,
 * so off-screen chapters resolving their estimated size (base.css) bend the path instead of missing the mark;
 * after arriving it stays pinned through later layout shifts until the reader scrolls or points.
 */
export function createAnchorScroller(signal: AbortSignal) {
  const motion = reducedMotion();
  const root = document.documentElement;
  let destination: HTMLElement | null = null;
  let frame = 0;

  const topOf = (target: HTMLElement) => {
    const padding = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    const max = root.scrollHeight - window.innerHeight;
    return Math.min(max, Math.max(0, window.scrollY + target.getBoundingClientRect().top - padding));
  };
  const jump = (top: number) => window.scrollTo({ top, behavior: 'instant' });
  const pin = () => { if (destination && !frame) jump(topOf(destination)); };

  function stop() {
    destination = null;
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function go(target: HTMLElement, animate = true) {
    stop();
    destination = target;
    const duration = animate && !motion.matches ? cssDuration('--scroll-duration') : 0;
    if (!duration) return pin();
    const ease = cssEasing('--ease-in-out');
    const from = window.scrollY;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      jump(from + (topOf(target) - from) * ease(t));
      frame = t < 1 ? requestAnimationFrame(step) : 0;
    };
    frame = requestAnimationFrame(step);
  }

  const observer = new ResizeObserver(pin);
  document.querySelectorAll('[data-chapter]').forEach(chapter => observer.observe(chapter));
  window.addEventListener('resize', pin, { signal });
  for (const type of ['wheel', 'touchstart', 'pointerdown'] as const) window.addEventListener(type, stop, { passive: true, signal });
  window.addEventListener('keydown', event => { if (STOP_KEYS.has(event.key)) stop(); }, { signal });
  signal.addEventListener('abort', () => { stop(); observer.disconnect(); }, { once: true });
  return { go, stop };
}
