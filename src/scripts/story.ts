import { initializeAnchors, initializeNavigation } from './story/navigation';
import { initializePrinting } from './story/printing';
import { initializeReveal } from './story/reveal';
import { initializeSplitDemo } from './story/split-demo';
import { initializePreviewSlot } from './story/preview-slot';
import { initializeContact } from './story/contact';

let dispose = () => {};
function initializeStory() {
  dispose();
  if (!document.querySelector('.story-body')) return;
  const controller = new AbortController();
  dispose = () => controller.abort();
  initializeAnchors(controller.signal);
  initializeNavigation(controller.signal);
  initializeReveal(controller.signal);
  initializeSplitDemo(controller.signal);
  initializePreviewSlot(controller.signal);
  initializeContact(controller.signal);
  initializePrinting(controller.signal);
}

initializeStory();
window.addEventListener('pageshow', event => { if (event.persisted) initializeStory(); });
window.addEventListener('pagehide', () => dispose());
