import { finePointer, reducedMotion } from './shared/media';

// First-visit offer to read the story full screen. Browsers allow fullscreen only from a click, so it asks once.
const SEEN = 'itisme:fullscreen-offer';
const DELAY = 1800; // ms after load, once the opening has settled

export function initializeFullscreenOffer(signal: AbortSignal) {
  const root = document.documentElement;
  // Phones lack the page fullscreen API (iPhone) or gain little from it; a choice already made is kept.
  if (!root.requestFullscreen || !finePointer().matches || document.fullscreenElement) return;
  try { if (localStorage.getItem(SEEN)) return; } catch { return; }

  const offer = document.createElement('div');
  offer.className = 'fullscreen-offer';
  offer.setAttribute('role', 'status');
  offer.innerHTML = '<p>전체화면으로 보면 자료를 더 크게 볼 수 있어요.</p><button type="button" class="fullscreen-go">전체화면으로 보기</button><button type="button" class="fullscreen-skip" aria-label="닫기"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 3l10 10M13 3 3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>';

  const dismiss = () => {
    try { localStorage.setItem(SEEN, '1'); } catch { /* private mode: the offer may return next visit */ }
    offer.classList.remove('is-visible');
    setTimeout(() => offer.remove(), reducedMotion().matches ? 0 : 400);
  };
  offer.querySelector('.fullscreen-go')!.addEventListener('click', () => {
    root.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
    dismiss();
  }, { signal });
  offer.querySelector('.fullscreen-skip')!.addEventListener('click', dismiss, { signal });

  const timer = setTimeout(() => {
    document.body.append(offer);
    requestAnimationFrame(() => offer.classList.add('is-visible'));
  }, DELAY);
  signal.addEventListener('abort', () => { clearTimeout(timer); offer.remove(); });
}
