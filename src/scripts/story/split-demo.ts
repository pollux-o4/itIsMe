export type SplitMode = 'random' | 'time';

export function initializeSplitDemo(signal: AbortSignal) {
  document.querySelectorAll<HTMLElement>('[data-split]').forEach(root => {
    const controls = root.querySelector<HTMLElement>('.split-controls');
    const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-split-mode]')];
    if (!controls || !buttons.length) return;
    const select = (mode: SplitMode) => {
      root.dataset.mode = mode;
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.splitMode === mode)));
    };
    buttons.forEach(button => button.addEventListener('click', () => select(button.dataset.splitMode as SplitMode), { signal }));
    // The story starts from the split that raised the doubt; static HTML keeps the final split.
    controls.hidden = false;
    select('random');
    signal.addEventListener('abort', () => {
      controls.hidden = true;
      select('time');
    }, { once: true });
  });
}
