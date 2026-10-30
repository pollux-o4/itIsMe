// Only chapter titles arrive; body copy is never hidden behind scroll.
export function initializeReveal(signal: AbortSignal) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window)) return;
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        if (entry.target.classList.contains('is-waiting')) entry.target.classList.add('is-arrived');
        observer.unobserve(entry.target);
      } else entry.target.classList.add('is-waiting');
    }
  }, { threshold: 0.25 });
  targets.forEach(target => observer.observe(target));
  function restore() {
    observer.disconnect();
    targets.forEach((target) => target.classList.remove('is-waiting', 'is-arrived'));
  }
  motion.addEventListener('change', event => { if (event.matches) restore(); }, { signal });
  signal.addEventListener('abort', restore, { once: true });
}
