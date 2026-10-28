export function initializePortrait(signal: AbortSignal) {
    const portrait = document.querySelector<HTMLDialogElement>('[data-portrait-dialog]');
    const control = document.querySelector<HTMLElement>('[data-portrait-control]');
    const openButton = document.querySelector<HTMLButtonElement>('[data-portrait-open]');
    const closeButton = document.querySelector<HTMLButtonElement>('[data-portrait-close]');
    openButton?.addEventListener('click', () => portrait?.showModal(), { signal });
    closeButton?.addEventListener('click', () => portrait?.close(), { signal });
    portrait?.addEventListener('click', event => {
        if (event.target === portrait)
            portrait.close();
    }, { signal });
    const resetPeek = () => control?.removeAttribute('data-dismissed');
    control?.addEventListener('pointerenter', resetPeek, { signal });
    control?.addEventListener('pointerleave', resetPeek, { signal });
    control?.addEventListener('focusout', resetPeek, { signal });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && (portrait?.open || control?.matches(':hover, :focus-within'))) {
            control?.setAttribute('data-dismissed', '');
        }
    }, { signal });
    signal.addEventListener('abort', () => portrait?.close(), { once: true });
}
