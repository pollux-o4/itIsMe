export function initializeNavigation(signal: AbortSignal) {
  const navLinks = [...document.querySelectorAll<HTMLAnchorElement>('.story-nav a')];
  const sections = [...document.querySelectorAll<HTMLElement>('[data-chapter]')];
  const nav = document.querySelector<HTMLElement>('.story-nav');
  const masthead = document.querySelector<HTMLElement>('.masthead');
  const progress = document.querySelector<HTMLElement>('.reading-progress span');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let lastY: number | undefined;
  let directionStartY = 0;
  let direction = 0;
  let frame = 0;
  let activeId = '';

  function readLocation() {
    const readingEdge = Math.max(140, window.innerHeight * 0.25);
    // Read geometry together before changing styles or scrolling the chapter list.
    const chapters = sections.map(section => ({ section, rect: section.getBoundingClientRect() }));
    const active = chapters.filter(chapter => chapter.rect.top <= readingEdge).at(-1) ?? chapters[0];
    const beneath = chapters.find(chapter => chapter.rect.top <= 32 && chapter.rect.bottom > 32);
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    return {
      id: active?.section.id ?? '',
      night: Boolean(beneath?.section.classList.contains('is-night')),
      progress: scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0,
    };
  }

  function updateLocation() {
    frame = 0;
    const state = readLocation();
    lastY ??= window.scrollY;
    if (progress) progress.style.transform = `scaleX(${state.progress})`;
    masthead?.classList.toggle('on-night', state.night);
    masthead?.classList.toggle('is-scrolled', window.scrollY > 24);
    if (activeId === state.id) return;
    activeId = state.id;
    navLinks.forEach(link => {
      if (link.hash === `#${activeId}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const current = navLinks.find(link => link.hash === `#${activeId}`);
    if (nav && current && nav.scrollWidth > nav.clientWidth) {
      nav.scrollTo({ left: current.offsetLeft - nav.clientWidth / 2 + current.offsetWidth / 2, behavior: motion.matches ? 'instant' : 'smooth' });
    }
  }

  function scheduleLocation() {
    if (!frame) frame = requestAnimationFrame(updateLocation);
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
    activeId = '';
    lastY = directionStartY = window.scrollY;
    direction = 0;
    scheduleLocation();
  }, { signal });
  masthead?.addEventListener('focusin', () => masthead.classList.remove('is-scroll-hidden'), { signal });
  document.addEventListener('toggle', scheduleLocation, { capture: true, signal });
  // Observe layout first: even reading scrollY during initialization forces a full reflow.
  const observer = new ResizeObserver(scheduleLocation);
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
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;
      if (target instanceof HTMLDetailsElement) target.open = true;
      destination = target;
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
    }, { signal });
  });
  window.addEventListener('hashchange', openHash, { signal });
  // Keep native history and animation; resizing must cancel a destination computed for the old layout.
  window.addEventListener('resize', () => destination?.scrollIntoView({ behavior: 'instant', block: 'start' }), { signal });
  document.addEventListener('scrollend', () => { destination = null; }, { signal });
  const cancel = () => { destination = null; };
  window.addEventListener('wheel', cancel, { passive: true, signal });
  window.addEventListener('touchstart', cancel, { passive: true, signal });
  window.addEventListener('keydown', event => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Escape', ' '].includes(event.key)) cancel();
  }, { signal });
  openHash();
}
