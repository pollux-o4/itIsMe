import { fitRatio, invertTransform } from '../shared/geometry';
import { closeIcon } from '../shared/icons';
import { finePointer, reducedMotion } from '../shared/media';
import { easeOut } from '../shared/motion';
import { attachPanZoom } from './pan-zoom';
import { readExhibit, type ExhibitSource } from './source';

// Evidence lightbox: a picture grows from its tile into the largest box of its own ratio, then returns there.
const EDGE = 0.92; // share of the viewport the picture may take on its limiting side
const CAPTION_ROOM = 160; // px kept under the picture for caption and keys
const UPSCALE = 1.5; // beyond this the source pixels show
const TEXT_MIN = 560; // caption column never narrower than this, screen allowing

function createDialog() {
  const dialog = document.createElement('dialog');
  dialog.className = 'viewer';
  dialog.setAttribute('aria-label', '자료 크게 보기');
  dialog.innerHTML = `<div class="viewer-stage"></div><div class="viewer-text"></div><button type="button" class="overlay-icon-button viewer-close" aria-label="닫기">${closeIcon(18)}</button>`;
  return { dialog, stage: dialog.querySelector<HTMLElement>('.viewer-stage')!, text: dialog.querySelector<HTMLElement>('.viewer-text')! };
}

const hintText = () => finePointer().matches
  ? '휠로 확대 · 끌어서 이동 · 더블클릭으로 원래 크기'
  : '두 손가락으로 확대 · 두 번 탭해 원래 크기';

export function initializeExhibitViewer(signal: AbortSignal) {
  const frames = [...document.querySelectorAll<HTMLElement>('.exhibit-frame')];
  if (!frames.length) return;
  const calm = reducedMotion();
  const { dialog, stage, text } = createDialog();
  document.body.append(dialog);
  signal.addEventListener('abort', () => dialog.remove());
  const panZoom = attachPanZoom(stage, signal);
  let current: ExhibitSource | null = null;
  let closing = false;

  const fit = () => {
    if (!current) return;
    const room = { width: innerWidth * EDGE, height: innerHeight * EDGE - CAPTION_ROOM };
    const box = fitRatio(room, current.ratio, current.sourceWidth * UPSCALE || Infinity);
    Object.assign(stage.style, { width: `${box.width}px`, height: `${box.height}px` });
    text.style.width = `${Math.max(box.width, Math.min(TEXT_MIN, innerWidth - 48))}px`;
  };
  // FLIP: the stage is laid out at its final box, then animated from the tile's box.
  const fly = (tile: DOMRect, reverse: boolean) => {
    const keyframes = [{ transform: invertTransform(tile, stage.getBoundingClientRect()) }, { transform: 'none' }];
    return stage.animate(reverse ? keyframes.reverse() : keyframes, { duration: reverse ? 360 : 480, easing: easeOut(), fill: 'both' }).finished;
  };
  const settle = () => stage.getAnimations().forEach(animation => animation.cancel());

  const open = (frame: HTMLElement) => {
    current = readExhibit(frame);
    stage.replaceChildren(current.layer());
    const hint = Object.assign(document.createElement('p'), { className: 'viewer-hint', textContent: hintText() });
    text.replaceChildren(...current.caption(), hint);
    panZoom.reset();
    fit();
    dialog.showModal();
    document.documentElement.classList.add('is-viewing');
    if (!calm.matches) fly(frame.getBoundingClientRect(), false).then(settle);
  };

  const close = async () => {
    if (!current || closing) return;
    closing = true;
    panZoom.reset(true);
    dialog.classList.add('is-closing');
    const tile = current.frame.getBoundingClientRect();
    const tileOnScreen = tile.bottom > 0 && tile.top < innerHeight;
    if (!calm.matches && tileOnScreen) await fly(tile, true);
    else await dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160 }).finished;
    settle();
    dialog.close();
  };

  dialog.addEventListener('close', () => {
    dialog.classList.remove('is-closing');
    document.documentElement.classList.remove('is-viewing');
    current?.frame.querySelector<HTMLElement>('.exhibit-zoom')?.focus({ preventScroll: true });
    current = null;
    closing = false;
  }, { signal });
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); }, { signal });
  // Outside the text a click closes, like a photo viewer; on the picture it belongs to zooming once zoomed or dragged.
  dialog.addEventListener('click', event => {
    const target = event.target as Element;
    if (target.closest('.viewer-text')) return;
    if (target.closest('.viewer-stage') && !panZoom.allowsClose()) return;
    close();
  }, { signal });
  addEventListener('resize', fit, { signal });
  for (const frame of frames) frame.addEventListener('click', () => open(frame), { signal });
}
