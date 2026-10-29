export function initializePrinting(signal: AbortSignal) {
    const details = [
        ...document.querySelectorAll<HTMLDetailsElement>("[data-disclosure]"),
    ];
    let beforePrint: boolean[] | null = null;
    function expandForPrint() {
        if (beforePrint)
            return;
        beforePrint = details.map((d) => d.open);
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
    }
    window.addEventListener("beforeprint", expandForPrint, { signal });
    window.addEventListener("afterprint", restoreAfterPrint, { signal });
    const printButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-print]")];
    let preparing = false;
    printButtons.forEach((button) => button.addEventListener("click", async () => {
        if (preparing) return;
        preparing = true;
        printButtons.forEach((item) => { item.disabled = true; item.setAttribute("aria-busy", "true"); });
        try {
            await document.fonts.ready;
            // A lazy image that never started loading is not on paper either; waiting on it would never settle.
            const printable = [...document.images].filter((image) => image.loading !== "lazy" || image.complete);
            await Promise.all(printable.map((image) => image.decode().catch(() => { })));
            if (!signal.aborted) window.print();
        } finally {
            preparing = false;
            printButtons.forEach((item) => { item.disabled = false; item.removeAttribute("aria-busy"); });
        }
    }, { signal }));
    signal.addEventListener("abort", restoreAfterPrint, { once: true });
}
