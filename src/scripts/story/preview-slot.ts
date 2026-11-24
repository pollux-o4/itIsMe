import { createSelection } from './shared/selection';

// The index preview changes inside its own slot; the static page shows the first case (SPEC 2.6).
export function initializePreviewSlot(signal: AbortSignal) {
  const panels = [...document.querySelectorAll<HTMLElement>('[data-preview]')];
  const rows = [...document.querySelectorAll<HTMLElement>('[data-preview-target]')];
  if (!panels.length || !rows.length) return;
  const initial = panels.find(panel => panel.hasAttribute('data-active'))?.dataset.preview ?? panels[0].dataset.preview!;
  const panelState = createSelection(panels, panel => panel.dataset.preview, (panel, on) => panel.toggleAttribute('data-active', on));
  const rowState = createSelection(rows, row => row.dataset.previewTarget, (row, on) => row.toggleAttribute('data-previewing', on));
  const select = (id: string) => { panelState.select(id); rowState.select(id); };
  rows.forEach(row => {
    const show = () => select(row.dataset.previewTarget!);
    row.addEventListener('pointerenter', show, { signal });
    row.addEventListener('focus', show, { signal });
  });
  panelState.reset(initial);
  rowState.reset(initial);
  signal.addEventListener('abort', () => select(initial), { once: true });
}
