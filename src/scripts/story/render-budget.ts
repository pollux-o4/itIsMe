// Off-screen chapters skip layout at first paint (base.css). After load they are released one per
// idle slice: the full layout cost is paid in short tasks instead of one long blocking task.
export function initializeRenderBudget(signal: AbortSignal) {
  const pending = [...document.querySelectorAll<HTMLElement>('.story-main > [data-chapter]:not(.is-rendered)')];
  const idle = window.requestIdleCallback ?? ((run: () => void) => setTimeout(run, 50));
  const next = () => {
    if (signal.aborted) return;
    pending.shift()?.classList.add('is-rendered');
    if (pending.length) idle(next, { timeout: 1000 });
  };
  if (document.readyState === 'complete') idle(next);
  else window.addEventListener('load', () => idle(next), { once: true, signal });
}
