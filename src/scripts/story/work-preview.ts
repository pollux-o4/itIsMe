// Archive hover card: shows what a closed row holds, trailing the pointer and tilting with its speed (SPEC 2.6).
export function initializeWorkPreview(signal: AbortSignal) {
  const rows = [...document.querySelectorAll<HTMLDetailsElement>('.work-row')];
  if (!rows.length || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const calm = matchMedia('(prefers-reduced-motion: reduce)');

  const card = document.createElement('div');
  card.className = 'work-preview';
  card.setAttribute('aria-hidden', 'true');
  const inner = card.appendChild(document.createElement('div'));
  const image = inner.appendChild(document.createElement('img'));
  image.alt = '';
  image.decoding = 'async';
  const text = inner.appendChild(document.createElement('p'));
  document.body.append(card);

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
    targetX = Math.max(edge, Math.min(event.clientX + offset, innerWidth - card.offsetWidth - edge));
    targetY = Math.max(edge, Math.min(event.clientY - card.offsetHeight / 2, innerHeight - card.offsetHeight - edge));
  };
  const hide = () => {
    active = null;
    card.classList.remove('is-visible');
  };
  const show = (row: HTMLDetailsElement, event: PointerEvent) => {
    const source = row.querySelector<HTMLImageElement>('.work-body img');
    const description = row.querySelector('.work-body p');
    if (!source || !description) return;
    if (active !== row) {
      image.src = source.currentSrc || source.src;
      image.srcset = source.srcset;
      image.sizes = '320px';
      text.innerHTML = description.innerHTML;
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
    card.remove();
  }, { once: true });
}
