// Pan and zoom inside a fixed box: wheel or pinch scales around the pointer, drag moves, double-click toggles.
// Zoom stops where the source runs out of pixels, but always allows at least 2x for small screens.
const FLOOR_MAX = 2;
const STEP = 0.0015; // scale change per wheel delta pixel

export function attachPanZoom(stage: HTMLElement, signal: AbortSignal) {
  let scale = 1, x = 0, y = 0;
  let moved = false;
  const pointers = new Map<number, { x: number; y: number }>();
  let pinch = 0;

  const canvas = () => stage.firstElementChild as HTMLElement | null;
  // Keeps the enlarged picture covering the box, so no empty edge can be dragged into view.
  const clamp = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    x = Math.min(0, Math.max(w - w * scale, x));
    y = Math.min(0, Math.max(h - h * scale, y));
  };
  const apply = (smooth = false) => {
    const layer = canvas();
    if (!layer) return;
    clamp();
    layer.style.transition = smooth ? 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)' : '';
    layer.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    stage.classList.toggle('is-zoomed', scale > 1);
  };
  // Scales so the point under (px, py), in stage coordinates, stays put.
  const zoomAt = (next: number, px: number, py: number, smooth = false) => {
    const picture = canvas()?.querySelector('img');
    const max = Math.max(FLOOR_MAX, (picture?.naturalWidth || 0) / stage.clientWidth);
    next = Math.min(max, Math.max(1, next));
    x = px - (px - x) * (next / scale);
    y = py - (py - y) * (next / scale);
    scale = next;
    apply(smooth);
  };
  const local = (cx: number, cy: number) => {
    const box = stage.getBoundingClientRect();
    return [cx - box.left, cy - box.top] as const;
  };

  stage.addEventListener('wheel', event => {
    event.preventDefault();
    const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    zoomAt(scale * Math.exp(-delta * STEP * (event.ctrlKey ? 4 : 1)), ...local(event.clientX, event.clientY));
  }, { passive: false, signal });

  stage.addEventListener('dblclick', event => {
    zoomAt(scale > 1 ? 1 : 2.5, ...local(event.clientX, event.clientY), true);
  }, { signal });

  stage.addEventListener('pointerdown', event => {
    stage.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    moved = false;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = Math.hypot(a.x - b.x, a.y - b.y);
    }
  }, { signal });

  stage.addEventListener('pointermove', event => {
    const last = pointers.get(event.pointerId);
    if (!last) return;
    const now = { x: event.clientX, y: event.clientY };
    pointers.set(event.pointerId, now);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const span = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch) zoomAt(scale * (span / pinch), ...local((a.x + b.x) / 2, (a.y + b.y) / 2));
      pinch = span;
      moved = true;
    } else if (scale > 1) {
      x += now.x - last.x;
      y += now.y - last.y;
      if (Math.abs(now.x - last.x) + Math.abs(now.y - last.y) > 0) moved = true;
      apply();
    }
  }, { signal });

  const release = (event: PointerEvent) => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinch = 0;
  };
  stage.addEventListener('pointerup', release, { signal });
  stage.addEventListener('pointercancel', release, { signal });

  return {
    reset(smooth = false) { scale = 1; x = 0; y = 0; pointers.clear(); pinch = 0; moved = false; apply(smooth); },
    // A plain tap on an unzoomed picture still closes the viewer.
    allowsClose: () => scale === 1 && !moved,
  };
}
