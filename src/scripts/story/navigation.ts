import { createChapterMap } from './shared/chapter-map';
import { reducedMotion } from './shared/media';
import { createSelection } from './shared/selection';

const scrollKeys = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Escape', ' ']);

export function initializeNavigation(signal: AbortSignal) {
  const navLinks = [...document.querySelectorAll<HTMLAnchorElement>('.story-nav a')];
  const sections = [...document.querySelectorAll<HTMLElement>('[data-chapter]')];
  const nav = document.querySelector<HTMLElement>('.story-nav');
  const masthead = document.querySelector<HTMLElement>('.masthead');
  const progress = document.querySelector<HTMLElement>('.reading-progress span');
  const motion = reducedMotion();
  const chapters = createChapterMap(sections);
  const current = createSelection(navLinks, link => link.hash.slice(1), (link, on) => {
    if (on) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  });
  let lastY: number | undefined;
  let directionStartY = 0;
  let direction = 0;
  let frame = 0;
  let readingEdge = 0;
  const measureViewport = () => { readingEdge = Math.max(140, window.innerHeight * 0.25); };
  measureViewport();

  function updateLocation() {
    frame = 0;
    const y = window.scrollY;
    const state = chapters.locate(y, readingEdge);
    lastY ??= y;
    if (progress) progress.style.transform = `scaleX(${state.progress})`;
    masthead?.classList.toggle('on-night', Boolean(state.beneath?.classList.contains('is-night')));
    masthead?.classList.toggle('is-scrolled', y > 24);
    const id = state.active?.id ?? '';
    if (!current.select(id)) return;
    const link = current.get(id);
    if (nav && link && nav.scrollWidth > nav.clientWidth) {
      nav.scrollTo({ left: link.offsetLeft - nav.clientWidth / 2 + link.offsetWidth / 2, behavior: motion.matches ? 'instant' : 'smooth' });
    }
  }

  function scheduleLocation() {
    if (!frame) frame = requestAnimationFrame(updateLocation);
  }
  function relayout() {
    chapters.invalidate();
    scheduleLocation();
  }

  function updateMasthead() {
    const y = Math.max(0, window.scrollY);
    const nextDirection = Math.sign(y - (lastY ?? y));
    if (nextDirection && nextDirection !== direction) {
      direction = nextDirection;
      directionStartY = lastY ?? y;
    }
    if (masthead) {
      if (y < 120 || (direction < 0 && directionStartY - y >= 12)) masthead.classList.remove('is-scroll-hidden');
      else if (direction > 0 && y - directionStartY >= 24 && !masthead.contains(document.activeElement)) masthead.classList.add('is-scroll-hidden');
    }
    lastY = y;
    scheduleLocation();
  }

  window.addEventListener('scroll', updateMasthead, { passive: true, signal });
  window.addEventListener('resize', () => {
    masthead?.classList.remove('is-scroll-hidden');
    measureViewport();
    lastY = directionStartY = window.scrollY;
    direction = 0;
    relayout();
  }, { signal });
  masthead?.addEventListener('focusin', () => masthead.classList.remove('is-scroll-hidden'), { signal });
  document.addEventListener('toggle', relayout, { capture: true, signal });
  // Observe layout first: even reading scrollY during initialization forces a full reflow.
  // Any chapter resizing moves every chapter below it, so one change invalidates the whole map.
  const observer = new ResizeObserver(relayout);
  sections.forEach(section => observer.observe(section));
  signal.addEventListener('abort', () => {
    observer.disconnect();
    cancelAnimationFrame(frame);
    masthead?.classList.remove('is-scroll-hidden');
  }, { once: true });
}

export function initializeAnchors(signal: AbortSignal) {
  let destination: HTMLElement | null = null;
  function openHash() {
    const target = document.getElementById(location.hash.slice(1));
    if (target instanceof HTMLDetailsElement) target.open = true;
  }
  // One delegated listener instead of one per in-page link.
  document.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]');
    const target = link && document.getElementById(link.hash.slice(1));
    if (!target) return;
    if (target instanceof HTMLDetailsElement) target.open = true;
    destination = target;
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
  }, { signal });
  window.addEventListener('hashchange', openHash, { signal });
  // Keep native history and animation; resizing must cancel a destination computed for the old layout.
  window.addEventListener('resize', () => destination?.scrollIntoView({ behavior: 'instant', block: 'start' }), { signal });
  document.addEventListener('scrollend', () => { destination = null; }, { signal });
  const cancel = () => { destination = null; };
  window.addEventListener('wheel', cancel, { passive: true, signal });
  window.addEventListener('touchstart', cancel, { passive: true, signal });
  window.addEventListener('keydown', event => {
    if (scrollKeys.has(event.key)) cancel();
  }, { signal });
  openHash();
}
