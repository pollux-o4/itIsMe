import { finePointer, reducedMotion } from './shared/media';

// Archive hover card: shows what a closed row holds, trailing the pointer and tilting with its speed (SPEC 2.6).
export function initializeWorkPreview(signal: AbortSignal) {
  const rows = [...document.querySelectorAll<HTMLDetailsElement>('.work-row')];
  if (!rows.length || !finePointer().matches) return;
  const calm = reducedMotion();

  const card = document.createElement('div');
  card.className = 'work-preview';
  card.setAttribute('aria-hidden', 'true');
  const inner = card.appendChild(document.createElement('div'));
  const image = inner.appendChild(document.createElement('img'));
  image.alt = '';
  image.decoding = 'async';
  const text = inner.appendChild(document.createElement('p'));
  document.body.append(card);
  // Card size changes only with its content; reading it per pointermove would force layout each event.
  let cardWidth = 0, cardHeight = 0;
  const sizeObserver = new ResizeObserver(([entry]) => {
    const box = entry.borderBoxSize[0];
    cardWidth = box.inlineSize;
    cardHeight = box.blockSize;
  });
  sizeObserver.observe(card);
  // Each row's preview sources are looked up once, not on every pointermove.
  const sources = new WeakMap<HTMLDetailsElement, { image: HTMLImageElement; description: Element } | null>();
  const sourceOf = (row: HTMLDetailsElement) => {
    if (!sources.has(row)) {
      const image = row.querySelector<HTMLImageElement>('.work-body img');
      const description = row.querySelector('.work-body p');
      sources.set(row, image && description ? { image, description } : null);
    }
    return sources.get(row)!;
  };

  let x = 0, y = 0, targetX = 0, targetY = 0, last = 0, frame = 0, active: HTMLDetailsElement | null = null;
  const edge = 16, offset = 24;
  const paint = (tilt: number) => { card.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${tilt}deg)`; };
  const step = (now: number) => {
    // Time-based damping: the same glide at any refresh rate, and no overshoot to shake the page.
    const ease = 1 - Math.exp(-(now - last) * 0.012);
    last = now;
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;
    const lag = targetX - x;
    paint(Math.max(-5, Math.min(5, lag * 0.035)));
    const settled = Math.abs(lag) < 0.2 && Math.abs(targetY - y) < 0.2;
    frame = settled ? 0 : requestAnimationFrame(step);
  };
  const aim = (event: PointerEvent) => {
    targetX = Math.max(edge, Math.min(event.clientX + offset, innerWidth - cardWidth - edge));
    targetY = Math.max(edge, Math.min(event.clientY - cardHeight / 2, innerHeight - cardHeight - edge));
  };
  const hide = () => {
    active = null;
    card.classList.remove('is-visible');
  };
  const show = (row: HTMLDetailsElement, event: PointerEvent) => {
    const preview = sourceOf(row);
    if (!preview) return;
    if (active !== row) {
      image.src = preview.image.currentSrc || preview.image.src;
      image.srcset = preview.image.srcset;
      image.sizes = '320px';
      text.innerHTML = preview.description.innerHTML;
      // New content: measure once now so the first placement uses the real size.
      cardWidth = card.offsetWidth;
      cardHeight = card.offsetHeight;
    }
    const entering = !card.classList.contains('is-visible');
    active = row;
    card.classList.add('is-visible');
    aim(event);
    if (entering || calm.matches) {
      // Starts at the pointer rather than flying in from wherever it last was.
      x = targetX;
      y = targetY;
      paint(0);
      return;
    }
    if (!frame) {
      last = performance.now();
      frame = requestAnimationFrame(step);
    }
  };

  rows.forEach(row => {
    const summary = row.querySelector('summary');
    if (!summary) return;
    summary.addEventListener('pointermove', event => {
      if (event.pointerType !== 'touch' && !row.open) show(row, event);
    }, { signal });
    summary.addEventListener('pointerleave', hide, { signal });
    // An opened row already shows the same picture and text in place.
    row.addEventListener('toggle', () => { if (row.open && active === row) hide(); }, { signal });
    summary.addEventListener('click', hide, { signal });
  });
  window.addEventListener('scroll', hide, { signal, passive: true });
  signal.addEventListener('abort', () => {
    cancelAnimationFrame(frame);
    sizeObserver.disconnect();
    card.remove();
  }, { once: true });
}
