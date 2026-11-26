import { finePointer, reducedMotion } from './shared/media';
import { attachPanZoom } from './viewer-pan-zoom';

// Evidence lightbox: a picture grows from its place into the largest box of its own ratio, then returns there.
const EDGE = 0.92; // share of the viewport the picture may take on its limiting side
const CHROME = 160; // px kept under the picture for its caption and keys

export function initializeExhibitViewer(signal: AbortSignal) {
  const frames = [...document.querySelectorAll<HTMLElement>('.exhibit-frame')];
  if (!frames.length) return;
  const calm = reducedMotion();

  const dialog = document.createElement('dialog');
  dialog.className = 'viewer';
  dialog.setAttribute('aria-label', '자료 크게 보기');
  dialog.innerHTML = '<div class="viewer-stage"></div><div class="viewer-text"></div><button type="button" class="viewer-close" aria-label="닫기"><svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true"><path d="M3 3l10 10M13 3 3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>';
  document.body.append(dialog);
  signal.addEventListener('abort', () => dialog.remove());
  const stage = dialog.querySelector<HTMLElement>('.viewer-stage')!;
  const text = dialog.querySelector<HTMLElement>('.viewer-text')!;
  let source: HTMLElement | null = null;
  let closing = false;
  const panZoom = attachPanZoom(stage, signal);

  const ratioOf = (frame: HTMLElement) => Number(frame.style.getPropertyValue('--ratio')) || 1;
  // N:M fit: the picture keeps its ratio and fills whichever side runs out first.
  const fit = () => {
    if (!source) return;
    const ratio = ratioOf(source);
    const width = Math.min(innerWidth * EDGE, (innerHeight * EDGE - CHROME) * ratio, Number(source.style.getPropertyValue('--source-width')) * 1.5 || Infinity);
    stage.style.width = `${Math.round(width)}px`;
    stage.style.height = `${Math.round(width / ratio)}px`;
    text.style.width = `${Math.max(Math.round(width), Math.min(560, innerWidth - 48))}px`;
  };

  // Moves the stage from one box to another with a transform, so only compositing runs.
  const zoom = (from: DOMRect, to: DOMRect, reverse = false) => {
    const sx = from.width / to.width, sy = from.height / to.height;
    const dx = from.left - to.left, dy = from.top - to.top;
    const frames = [{ transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` }, { transform: 'none' }];
    return stage.animate(reverse ? frames.reverse() : frames, { duration: reverse ? 360 : 480, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' }).finished;
  };

  const open = (frame: HTMLElement) => {
    source = frame;
    const picture = frame.querySelector('img')!.cloneNode() as HTMLImageElement;
    picture.sizes = '100vw';
    picture.loading = 'eager';
    const canvas = document.createElement('div');
    canvas.className = 'viewer-canvas';
    canvas.append(picture, ...[...frame.querySelectorAll('.exhibit-mark')].map(mark => mark.cloneNode(true)));
    stage.replaceChildren(canvas);
    panZoom.reset();
    const caption = frame.closest('.exhibit')?.querySelector('figcaption');
    const hint = document.createElement('p');
    hint.className = 'viewer-hint';
    hint.textContent = finePointer().matches ? '휠로 확대 · 끌어서 이동 · 더블클릭으로 원래 크기' : '두 손가락으로 확대 · 두 번 탭해 원래 크기';
    text.replaceChildren(...(caption ? [...caption.children].map(child => child.cloneNode(true)) : []), hint);
    fit();
    dialog.showModal();
    document.documentElement.classList.add('is-viewing');
    if (!calm.matches) zoom(frame.getBoundingClientRect(), stage.getBoundingClientRect()).then(() => stage.getAnimations().forEach(a => a.cancel()));
  };

  const close = async () => {
    if (!source || closing) return;
    closing = true;
    panZoom.reset(true);
    dialog.classList.add('is-closing');
    const back = source.getBoundingClientRect();
    const onScreen = back.bottom > 0 && back.top < innerHeight;
    if (!calm.matches && onScreen) await zoom(back, stage.getBoundingClientRect(), true);
    else await dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160 }).finished;
    stage.getAnimations().forEach(a => a.cancel());
    dialog.close();
  };

  dialog.addEventListener('close', () => {
    dialog.classList.remove('is-closing');
    document.documentElement.classList.remove('is-viewing');
    source?.querySelector<HTMLElement>('.exhibit-zoom')?.focus({ preventScroll: true });
    source = null;
    closing = false;
  }, { signal });
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); }, { signal });
  // A click anywhere but the text closes, the way a photo viewer does; the text can be selected.
  // While the picture is enlarged or was just dragged, a click on it belongs to the zoom, not to closing.
  dialog.addEventListener('click', event => {
    const target = event.target as Element;
    if (target.closest('.viewer-text')) return;
    if (target.closest('.viewer-stage') && !panZoom.allowsClose()) return;
    close();
  }, { signal });
  addEventListener('resize', fit, { signal });
  for (const frame of frames) frame.addEventListener('click', () => open(frame), { signal });
}
