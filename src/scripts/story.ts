import { initializeNavigation } from './story/navigation';
import { initializePortrait } from './story/portrait';
import { initializePreview } from './story/preview';
import { initializePrinting } from './story/printing';

let dispose = () => {};
function initializeStory() {
  dispose();
  if (!document.querySelector('.story-body')) return;
  const controller = new AbortController();
  dispose = () => controller.abort();
  initializeNavigation(controller.signal);
  initializePortrait(controller.signal);
  const preview = initializePreview(controller.signal);
  initializePrinting(controller.signal, preview);
}

document.addEventListener('astro:page-load', initializeStory);
document.addEventListener('astro:before-swap', () => dispose());
