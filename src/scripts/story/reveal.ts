// Only chapter titles arrive; body copy is never hidden behind scroll.
export function initializeReveal(signal: AbortSignal) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-arrived');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.25 });
  targets.forEach((target) => {
    // Titles already on screen at load stay put instead of replaying.
    if (target.getBoundingClientRect().top < window.innerHeight) return;
    target.classList.add('is-waiting');
    observer.observe(target);
  });
  signal.addEventListener('abort', () => {
    observer.disconnect();
    targets.forEach((target) => target.classList.remove('is-waiting', 'is-arrived'));
  }, { once: true });
}
