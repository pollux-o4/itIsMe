// The index preview changes inside its own slot; the static page shows the first case (SPEC 2.6).
export function initializePreviewSlot(signal: AbortSignal) {
  const panels = [...document.querySelectorAll<HTMLElement>('[data-preview]')];
  const rows = [...document.querySelectorAll<HTMLElement>('[data-preview-target]')];
  if (!panels.length || !rows.length) return;
  const initial = panels.find(panel => panel.hasAttribute('data-active'))?.dataset.preview ?? panels[0].dataset.preview!;
  const select = (id: string) => {
    panels.forEach(panel => panel.toggleAttribute('data-active', panel.dataset.preview === id));
    rows.forEach(row => row.toggleAttribute('data-previewing', row.dataset.previewTarget === id));
  };
  rows.forEach(row => {
    const show = () => select(row.dataset.previewTarget!);
    row.addEventListener('pointerenter', show, { signal });
    row.addEventListener('focus', show, { signal });
  });
  select(initial);
  signal.addEventListener('abort', () => select(initial), { once: true });
}
