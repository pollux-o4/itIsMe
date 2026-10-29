import { initializeNavigation } from './story/navigation';
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
  initializeNavigation(controller.signal);
  initializeReveal(controller.signal);
  initializeSplitDemo(controller.signal);
  initializePreviewSlot(controller.signal);
  initializeContact(controller.signal);
  initializePrinting(controller.signal);
}

document.addEventListener('astro:page-load', initializeStory);
document.addEventListener('astro:before-swap', () => dispose());
