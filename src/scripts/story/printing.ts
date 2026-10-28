import type { PreviewSelection } from './preview-selection';
export function initializePrinting(signal: AbortSignal, preview: PreviewSelection) {
    const details = [
        ...document.querySelectorAll<HTMLDetailsElement>("[data-disclosure]"),
    ];
    let beforePrint: boolean[] | null = null;
    let beforePreview = preview.selected;
    function expandForPrint() {
        if (beforePrint)
            return;
        beforePrint = details.map((d) => d.open);
        beforePreview = preview.selected;
        preview.reset();
        details.forEach((d) => {
            d.open = true;
        });
    }
    function restoreAfterPrint() {
        if (!beforePrint)
            return;
        details.forEach((d, i) => {
            d.open = beforePrint![i];
        });
        beforePrint = null;
        preview.select(beforePreview);
    }
    window.addEventListener("beforeprint", expandForPrint, { signal });
    window.addEventListener("afterprint", restoreAfterPrint, { signal });
    document
        .querySelectorAll<HTMLButtonElement>("[data-print]")
        .forEach((button) => button.addEventListener("click", async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map((image) => image.decode().catch(() => { })));
        if (!signal.aborted)
            window.print();
    }, { signal }));
    signal.addEventListener("abort", restoreAfterPrint, { once: true });
}
