// Pure box math for the picture viewer: no DOM, so every rule here is unit-checked in check-geometry.

export interface Size { width: number; height: number }
export interface Box extends Size { left: number; top: number }
/** A zoom state: the layer is scaled by `scale` from its top-left corner, then moved by (x, y). */
export interface View { scale: number; x: number; y: number }

export const IDENTITY: View = { scale: 1, x: 0, y: 0 };

/**
 * N:M fit: the largest box of `ratio` (width / height) inside `room`, never wider than `maxWidth`.
 * O(1).
 */
export function fitRatio(room: Size, ratio: number, maxWidth = Infinity): Size {
  const width = Math.max(0, Math.min(room.width, room.height * ratio, maxWidth));
  return { width: Math.round(width), height: Math.round(width / ratio) };
}

/** The transform that makes a box drawn at `to` appear at `from` (FLIP's "invert" step). */
export function invertTransform(from: Box, to: Box): string {
  const sx = from.width / to.width, sy = from.height / to.height;
  return `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${sx}, ${sy})`;
}

/** Keeps a scaled layer covering its `frame`, so no empty edge can be dragged into view. */
export function clampView(view: View, frame: Size): View {
  const scale = Math.max(1, view.scale);
  return {
    scale,
    x: Math.min(0, Math.max(frame.width * (1 - scale), view.x)),
    y: Math.min(0, Math.max(frame.height * (1 - scale), view.y)),
  };
}

/** Scales to `next` (bounded by [1, max]) while the frame point (px, py) stays under the pointer. */
export function zoomAround(view: View, next: number, px: number, py: number, frame: Size, max: number): View {
  const scale = Math.min(max, Math.max(1, next));
  const k = scale / view.scale;
  return clampView({ scale, x: px - (px - view.x) * k, y: py - (py - view.y) * k }, frame);
}

/** Moves the layer by (dx, dy), then clamps. */
export function panBy(view: View, dx: number, dy: number, frame: Size): View {
  return clampView({ ...view, x: view.x + dx, y: view.y + dy }, frame);
}

export const toTransform = (view: View) => `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
