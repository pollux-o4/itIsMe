export function initializePrinting(signal: AbortSignal) {
  const details = [...document.querySelectorAll<HTMLDetailsElement>('[data-disclosure]')];
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-print]')];
  const status = document.querySelector<HTMLElement>('[data-print-status]');
  const images = [...document.querySelectorAll<HTMLImageElement>('img[data-print-src]')];
  let snapshot: { details: boolean[]; images: { src: string; srcset: string | null; loading: string | null }[] } | null = null;
  let preparing = false;
  buttons.forEach(button => {
    button.hidden = false;
    button.disabled = false;
    button.removeAttribute('aria-busy');
  });

  function expandForPrint() {
    if (snapshot) return;
    snapshot = {
      details: details.map(detail => detail.open),
      images: images.map(image => ({ src: image.src, srcset: image.getAttribute('srcset'), loading: image.getAttribute('loading') })),
    };
    details.forEach(detail => { detail.open = true; });
    images.forEach(image => {
      image.loading = 'eager';
      image.removeAttribute('srcset');
      image.src = image.dataset.printSrc!;
    });
  }

  function restoreAfterPrint() {
    if (!snapshot) return;
    const previous = snapshot;
    snapshot = null;
    details.forEach((detail, index) => { detail.open = previous.details[index]; });
    images.forEach((image, index) => {
      const saved = previous.images[index];
      image.src = saved.src;
      for (const [key, value] of [['srcset', saved.srcset], ['loading', saved.loading]] as const) {
        if (value === null) image.removeAttribute(key);
        else image.setAttribute(key, value);
      }
    });
  }

  window.addEventListener('beforeprint', expandForPrint, { signal });
  window.addEventListener('afterprint', restoreAfterPrint, { signal });
  buttons.forEach(button => button.addEventListener('click', async () => {
    if (preparing) return;
    preparing = true;
    if (status) status.textContent = '';
    buttons.forEach(item => { item.disabled = true; item.setAttribute('aria-busy', 'true'); });
    expandForPrint();
    const pending = new AbortController();
    const abort = () => pending.abort();
    signal.addEventListener('abort', abort, { once: true });
    const timer = window.setTimeout(abort, 10000);
    let printStarted = false;
    try {
      await Promise.race([
        (async () => {
          await document.fonts.load('17px "Pretendard Variable"', document.body.textContent ?? '');
          await document.fonts.ready;
          await Promise.all(images.map(image => image.decode()));
        })(),
        new Promise<never>((_, reject) => pending.signal.addEventListener('abort', () => reject(new Error('Print preparation interrupted')), { once: true })),
      ]);
      if (!signal.aborted) {
        printStarted = true;
        window.print();
      }
    } catch {
      printStarted = false;
      if (!signal.aborted && status) status.textContent = '인쇄 자료를 준비하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.';
    } finally {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      // Some browsers return from print() before the dialog closes; afterprint owns success cleanup.
      if (!printStarted) restoreAfterPrint();
      preparing = false;
      if (!signal.aborted) buttons.forEach(item => { item.disabled = false; item.removeAttribute('aria-busy'); });
    }
  }, { signal }));
  signal.addEventListener('abort', restoreAfterPrint, { once: true });
}
