import { IDENTITY, panBy, toTransform, zoomAround, type View } from '../shared/geometry';
import { cssDuration, easeOut } from '../shared/motion';

// Input adapter: turns wheel, pinch, drag and double-click into View changes; the math lives in geometry.
const FLOOR_MAX = 2; // always allow 2x, even when the source has no spare pixels
const WHEEL_STEP = 0.0015; // log-scale change per wheel pixel
const DOUBLE_TAP_SCALE = 2.5;

export interface PanZoom { reset(smooth?: boolean): void; allowsClose(): boolean }

export function attachPanZoom(stage: HTMLElement, signal: AbortSignal): PanZoom {
  let view: View = IDENTITY;
  let moved = false;
  const pointers = new Map<number, { x: number; y: number }>();
  let span = 0;

  const layer = () => stage.firstElementChild as HTMLElement | null;
  const frame = () => ({ width: stage.clientWidth, height: stage.clientHeight });
  // Zoom stops where the source runs out of pixels.
  const max = () => Math.max(FLOOR_MAX, (layer()?.querySelector('img')?.naturalWidth ?? 0) / stage.clientWidth);
  const local = (cx: number, cy: number) => {
    const box = stage.getBoundingClientRect();
    return [cx - box.left, cy - box.top] as const;
  };
  const render = (next: View, smooth = false) => {
    view = next;
    const target = layer();
    if (!target) return;
    target.style.transition = smooth ? `transform ${cssDuration('--viewer-zoom')}ms ${easeOut()}` : '';
    target.style.transform = toTransform(view);
    stage.classList.toggle('is-zoomed', view.scale > 1);
  };
  const zoomTo = (scale: number, cx: number, cy: number, smooth = false) =>
    render(zoomAround(view, scale, ...local(cx, cy), frame(), max()), smooth);

  stage.addEventListener('wheel', event => {
    event.preventDefault();
    const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    // Trackpad pinch arrives as ctrl+wheel with small deltas.
    zoomTo(view.scale * Math.exp(-delta * WHEEL_STEP * (event.ctrlKey ? 4 : 1)), event.clientX, event.clientY);
  }, { passive: false, signal });

  stage.addEventListener('dblclick', event =>
    zoomTo(view.scale > 1 ? 1 : DOUBLE_TAP_SCALE, event.clientX, event.clientY, true), { signal });

  const distance = () => {
    const [a, b] = [...pointers.values()];
    return { span: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
  };
  // Native image drag would cancel the pointer stream and steal mouse panning.
  stage.addEventListener('dragstart', event => event.preventDefault(), { signal });
  stage.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.pointerType === 'mouse') event.preventDefault();
    stage.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    moved = false;
    if (pointers.size === 2) span = distance().span;
  }, { signal });

  stage.addEventListener('pointermove', event => {
    const last = pointers.get(event.pointerId);
    if (!last) return;
    const now = { x: event.clientX, y: event.clientY };
    pointers.set(event.pointerId, now);
    if (pointers.size === 2) {
      const pinch = distance();
      if (span) zoomTo(view.scale * (pinch.span / span), pinch.cx, pinch.cy);
      span = pinch.span;
      moved = true;
    } else if (view.scale > 1 && (now.x !== last.x || now.y !== last.y)) {
      render(panBy(view, now.x - last.x, now.y - last.y, frame()));
      moved = true;
    }
  }, { signal });

  const release = (event: PointerEvent) => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) span = 0;
  };
  stage.addEventListener('pointerup', release, { signal });
  stage.addEventListener('pointercancel', release, { signal });

  return {
    reset(smooth = false) { pointers.clear(); span = 0; moved = false; render(IDENTITY, smooth); },
    // A plain tap on an unzoomed picture still closes the viewer.
    allowsClose: () => view.scale === 1 && !moved,
  };
}
