import type { PreviewSelection } from './preview-selection';
export function initializePreview(signal: AbortSignal): PreviewSelection {
    const preview = document.querySelector<HTMLElement>(".project-preview");
    const panels = [...document.querySelectorAll<HTMLAnchorElement>("[data-preview]")];
    const cards = [...document.querySelectorAll<HTMLAnchorElement>(".story-map .map-card")];
    const previewMedia = matchMedia("(min-width:800px) and (hover:hover) and (pointer:fine)");
    const reducedMotion = matchMedia("(prefers-reduced-motion:reduce)");
    const defaultId = panels.find(panel => panel.hasAttribute('data-preview-default'))?.dataset.preview;
    if (!defaultId)
        throw new Error('A default project preview is required.');
    const reset = () => selectPreview(defaultId);
    function selectPreview(id: string) {
        panels.forEach(panel => {
            const active = panel.dataset.preview === id;
            panel.toggleAttribute("data-active", active);
            panel.inert = !active;
            panel.setAttribute("aria-hidden", String(!active));
        });
        cards.forEach(card => card.toggleAttribute("data-preview-active", card.hash === `#${id}`));
        preview?.removeAttribute("style");
    }
    cards.forEach(card => {
        card.addEventListener("pointerenter", event => {
            if (previewMedia.matches && event.pointerType === "mouse")
                selectPreview(card.hash.slice(1));
        }, { signal });
        card.addEventListener("focusin", () => {
            if (previewMedia.matches && card.matches(":focus-visible"))
                selectPreview(card.hash.slice(1));
        }, { signal });
        card.addEventListener("pointermove", event => {
            if (!preview || !previewMedia.matches || reducedMotion.matches || event.pointerType !== "mouse")
                return;
            const rect = card.getBoundingClientRect();
            const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
            preview.style.setProperty("--preview-x", `${x * 6}px`);
            preview.style.setProperty("--preview-tilt", `${x * 1.2}deg`);
        }, { signal });
        card.addEventListener("pointerleave", () => preview?.removeAttribute("style"), { signal });
    });
    previewMedia.addEventListener("change", () => reset(), { signal });
    reducedMotion.addEventListener("change", () => preview?.removeAttribute("style"), { signal });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape")
            reset();
    }, { signal });
    return {
        select: selectPreview,
        reset,
        get selected() {
            return panels.find(panel => panel.hasAttribute('data-active'))?.dataset.preview || defaultId;
        },
    };
}
