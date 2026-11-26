import { initializeAnchors, initializeNavigation } from './story/navigation';
import { initializePrinting } from './story/printing';
import { initializeReveal } from './story/reveal';
import { initializeSplitDemo } from './story/split-demo';
import { initializePreviewSlot } from './story/preview-slot';
import { initializeWorkPreview } from './story/work-preview';
import { initializeContact } from './story/contact';
import { initializeExhibitViewer } from './story/exhibit-viewer';
import { initializeFullscreenOffer } from './story/fullscreen-offer';

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
  initializeWorkPreview(controller.signal);
  initializeContact(controller.signal);
  initializeExhibitViewer(controller.signal);
  initializeFullscreenOffer(controller.signal);
  initializePrinting(controller.signal);
}

initializeStory();
window.addEventListener('pageshow', event => { if (event.persisted) initializeStory(); });
window.addEventListener('pagehide', () => dispose());
