import { expect, test } from '@playwright/test';

test('portrait uses the embedded original and enough pixels for a high-density display', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4323/itIsMe/');
  const result = await page.locator('.hero-portrait img').evaluate(async element => {
    const displayed = element as HTMLImageElement;
    const original = new Image();
    original.src = displayed.dataset.printSrc!;
    await original.decode();
    const selected = new Image();
    selected.src = displayed.currentSrc;
    await selected.decode();
    return {
      original: [original.naturalWidth, original.naturalHeight],
      selected: selected.naturalWidth,
      required: Math.ceil(displayed.getBoundingClientRect().width * devicePixelRatio),
    };
  });
  expect(result.original).toEqual([922, 1383]);
  expect(result.selected).toBeGreaterThanOrEqual(Math.min(result.required, 922));
  await context.close();
});
