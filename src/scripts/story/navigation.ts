import { createChapterMap } from './shared/chapter-map';
import { reducedMotion } from './shared/media';
import { createAnchorScroller } from './shared/anchor-scroll';
import { isScrollLocked } from './shared/scroll-lock';
import { createSelection } from './shared/selection';

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
  // Viewport reads are lazy: reading innerHeight during init forces the first layout synchronously.
  let readingEdge: number | undefined;

  function updateLocation() {
    frame = 0;
    const y = window.scrollY;
    readingEdge ??= Math.max(140, window.innerHeight * 0.25);
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

  // Scroll and resize while a modal holds the scroll lock are not the reader moving.
  const rebase = () => { lastY = directionStartY = window.scrollY; direction = 0; };

  function updateMasthead() {
    const y = Math.max(0, window.scrollY);
    if (isScrollLocked()) { lastY = y; return; }
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
    if (!isScrollLocked()) masthead?.classList.remove('is-scroll-hidden');
    readingEdge = undefined;
    rebase();
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
  const scroller = createAnchorScroller(signal);
  const targetOf = (hash: string) => {
    const target = hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (target instanceof HTMLDetailsElement) target.open = true;
    return target;
  };
  // One delegated listener instead of one per in-page link; the scroll is ours, so the hash is pushed without a native jump.
  document.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]');
    const target = link && targetOf(link.hash);
    if (!target) return;
    event.preventDefault();
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
    scroller.go(target);
  }, { signal });
  window.addEventListener('hashchange', () => {
    const target = targetOf(location.hash);
    if (target) scroller.go(target);
  }, { signal });
  // The page owns scroll position: restored offsets land wrong while off-screen chapters still hold estimated
  // heights. A reload starts from the top; an arriving link with a hash lands on its target.
  history.scrollRestoration = 'manual';
  const reload = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type === 'reload';
  if (reload && location.hash) history.replaceState(null, '', location.pathname + location.search);
  const target = reload ? null : targetOf(location.hash);
  if (target) scroller.go(target, false);
  else if (reload) window.scrollTo({ top: 0, behavior: 'instant' });
}
