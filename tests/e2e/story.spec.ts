import { expect, test } from '@playwright/test';

declare global {
  interface Window { printSnapshots: { open: boolean; ready: boolean; originals: boolean }[] }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.printSnapshots = [];
    window.print = () => {
      window.dispatchEvent(new Event('beforeprint'));
      const pictures = [...document.querySelectorAll<HTMLImageElement>('img[data-print-src]')];
      window.printSnapshots.push({
        open: [...document.querySelectorAll<HTMLDetailsElement>('[data-disclosure]')].every(el => el.open),
        ready: pictures.length > 0 && pictures.every(el => el.complete && el.naturalWidth > 0),
        originals: pictures.every(el => el.src.endsWith(el.dataset.printSrc!) && !el.hasAttribute('srcset')),
      });
      window.dispatchEvent(new Event('afterprint'));
    };
  });
});

test('chapters, disclosures and keyboard focus survive native navigation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto('./');
  await page.getByRole('navigation').getByRole('link', { name: '02 농산물 가격' }).click();
  await expect(page.locator('#agriculture')).toBeFocused();
  await expect(page.locator('.story-nav [aria-current]')).toHaveAttribute('href', '#agriculture');
  await expect.poll(() => page.locator('#agriculture').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
  await page.getByRole('button', { name: '날짜순으로 나누기' }).click();
  await expect(page.getByRole('button', { name: '날짜순으로 나누기' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '무작위로 섞기' }).press('Enter');
  await expect(page.getByRole('button', { name: '무작위로 섞기' })).toHaveAttribute('aria-pressed', 'true');
  const details = page.locator('#agriculture-evidence');
  await details.locator('summary').press('Enter');
  await expect(details).toHaveAttribute('open', '');
  await details.locator('summary').press('Enter');
  await expect(details).not.toHaveAttribute('open');
  await page.goto('./#arxiv');
  await expect(page.locator('#arxiv')).toHaveAttribute('open', '');
  await page.locator('#arxiv > summary').press('Enter');
  await expect(page.locator('#arxiv')).not.toHaveAttribute('open');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('./notes/');
  await expect(page.getByRole('heading', { name: '개발 노트' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('button', { name: '이메일 복사' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('no JavaScript and reduced motion retain readable content', async ({ browser, page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await expect(page.locator('.hero-title')).toBeVisible();
  await expect.poll(() => page.locator('.hero-title .line > span').first().evaluate(el => getComputedStyle(el).transform)).toBe('none');
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: page.viewportSize()! });
  const staticPage = await context.newPage();
  await staticPage.goto('http://127.0.0.1:4323/itIsMe/');
  await expect(staticPage.locator('.hero-title')).toBeVisible();
  await expect(staticPage.locator('[data-split]')).toHaveAttribute('data-mode', 'time');
  await staticPage.locator('#nutrition-evidence > summary').click();
  await expect(staticPage.locator('#nutrition-evidence')).toHaveAttribute('open', '');
  await expect(staticPage.locator('[data-copy-email]')).toBeHidden();
  await expect(staticPage.locator('[data-print]')).toBeHidden();
  await context.close();
});

test('enabling reduced motion during reading immediately reveals waiting titles', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('./');
  await expect(page.locator('[data-reveal].is-waiting')).toHaveCount(3);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('[data-reveal].is-waiting')).toHaveCount(0);
  expect(await page.locator('[data-reveal] .line > span').evaluateAll(elements => elements.every(el => getComputedStyle(el).transform === 'none'))).toBe(true);
});

test('same-hash chapter links reopen collapsed destinations', async ({ page }) => {
  await page.goto('./#arxiv');
  await expect(page.locator('#arxiv')).toHaveAttribute('open', '');
  await page.locator('#arxiv > summary').click();
  // Exercise the real anchor handler without changing the site's editorial content.
  await page.evaluate(() => {
    const link = document.querySelector<HTMLAnchorElement>('.brand')!;
    link.href = '#arxiv';
  });
  await page.getByRole('link', { name: '주연석 포트폴리오 처음으로' }).press('Enter');
  await expect(page.locator('#arxiv')).toHaveAttribute('open', '');
});

test('printing prepares every original and restores disclosure and responsive images', async ({ page }) => {
  await page.goto('./');
  await page.locator('#nutrition-evidence > summary').press('Enter');
  const before = await page.locator('[data-disclosure]').evaluateAll(elements => elements.map(el => (el as HTMLDetailsElement).open));
  const image = page.locator('.hero-portrait img');
  const srcset = await image.getAttribute('srcset');
  await page.getByRole('button', { name: 'PDF로 저장' }).click();
  await expect.poll(() => page.evaluate(() => window.printSnapshots)).toEqual([{ open: true, ready: true, originals: true }]);
  expect(await page.locator('[data-disclosure]').evaluateAll(elements => elements.map(el => (el as HTMLDetailsElement).open))).toEqual(before);
  await expect(image).toHaveAttribute('srcset', srcset!);
  await expect(page.getByRole('button', { name: 'PDF로 저장' })).toBeEnabled();
});

test('failed print images report an actionable error and allow retry', async ({ page }) => {
  await page.goto('./');
  const originalURL = new URL((await page.locator('.evidence-picture img').first().getAttribute('data-print-src'))!, page.url()).href;
  await page.route(originalURL, route => route.abort());
  await page.getByRole('button', { name: 'PDF로 저장' }).click();
  await expect(page.locator('[data-print-status]')).toContainText('다시 시도');
  await expect(page.getByRole('button', { name: 'PDF로 저장' })).toBeEnabled();
  expect(await page.evaluate(() => window.printSnapshots)).toEqual([]);
  await page.unroute(originalURL);
  await page.getByRole('button', { name: 'PDF로 저장' }).click();
  await expect.poll(() => page.evaluate(() => window.printSnapshots)).toEqual([{ open: true, ready: true, originals: true }]);
});

test('print timeout and page departure cancel pending preparation', async ({ page }) => {
  await page.clock.install();
  await page.goto('./');
  const originalURL = new URL((await page.locator('.evidence-picture img').first().getAttribute('data-print-src'))!, page.url()).href;
  await page.route(originalURL, () => {});
  await page.getByRole('button', { name: 'PDF로 저장' }).click();
  await expect(page.getByRole('button', { name: '인쇄 준비 중' })).toBeDisabled();
  await page.clock.runFor(11000);
  await expect(page.locator('[data-print-status]')).toContainText('다시 시도');
  await page.getByRole('button', { name: 'PDF로 저장' }).click();
  await page.goto('./notes/');
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  await page.goBack();
  await expect(page.getByRole('button', { name: 'PDF로 저장' })).toBeEnabled();
  expect(await page.evaluate(() => window.printSnapshots)).toEqual([]);
});

test('a nonblocking print dialog keeps the print state until afterprint', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => { window.print = () => window.dispatchEvent(new Event('beforeprint')); });
  await page.getByRole('button', { name: 'PDF로 저장' }).click();
  await expect(page.getByRole('button', { name: 'PDF로 저장' })).toBeEnabled();
  await expect(page.locator('[data-disclosure]:not([open])')).toHaveCount(0);
  await expect(page.locator('.hero-portrait img')).not.toHaveAttribute('srcset');
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await expect(page.locator('[data-disclosure][open]')).toHaveCount(0);
  await expect(page.locator('.hero-portrait img')).toHaveAttribute('srcset');
});

test('a rejected native print call restores the page for retry', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => { window.print = () => { throw new Error('Printing unavailable'); }; });
  await page.getByRole('button', { name: 'PDF로 저장' }).click();
  await expect(page.locator('[data-print-status]')).toContainText('다시 시도');
  await expect(page.getByRole('button', { name: 'PDF로 저장' })).toBeEnabled();
  await expect(page.locator('[data-disclosure][open]')).toHaveCount(0);
  await expect(page.locator('.hero-portrait img')).toHaveAttribute('srcset');
});

test('Chromium renders a complete print artifact and restores the screen', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-1440', 'PDF rendering is provided by Chromium.');
  await page.goto('./');
  await page.evaluate(() => { window.print = () => window.dispatchEvent(new Event('beforeprint')); });
  await page.getByRole('button', { name: 'PDF로 저장' }).click();
  await expect(page.getByRole('button', { name: 'PDF로 저장' })).toBeEnabled();
  const output = await page.pdf({ path: testInfo.outputPath('portfolio.pdf'), format: 'A4', printBackground: true });
  expect(output.length).toBeGreaterThan(100000);
  await expect(page.locator('[data-disclosure][open]')).toHaveCount(0);
  await expect(page.locator('.hero-portrait img')).toHaveAttribute('srcset');
});

test('desktop preview follows pointer and keyboard without covering the questions', async ({ page }) => {
  test.skip(page.viewportSize()!.width < 1100, 'Preview is replaced by inline images on smaller screens.');
  await page.goto('./');
  const questions = page.locator('.question');
  await questions.nth(1).hover();
  const destination = await questions.nth(1).getAttribute('data-preview-target');
  await expect(page.locator('[data-preview][data-active]')).toHaveAttribute('data-preview', destination!);
  await questions.nth(1).press('Tab');
  await expect(questions.nth(2)).toBeFocused();
  await expect(page.locator('[data-preview][data-active]')).toHaveAttribute('data-preview', (await questions.nth(2).getAttribute('data-preview-target'))!);
  const questionRect = await questions.nth(2).boundingBox();
  const previewRect = await page.locator('.preview-slot').boundingBox();
  expect(previewRect!.x).toBeGreaterThanOrEqual(questionRect!.x + questionRect!.width);
});

test('chapter geometry stays correct through disclosure changes and resizing', async ({ page }) => {
  await page.goto('./#engine');
  const chapter = page.locator('#engine');
  const current = page.locator('.story-nav [aria-current]');
  await expect(current).toHaveAttribute('href', '#engine');
  await page.locator('#engine-evidence > summary').press('Enter');
  await page.getByRole('link', { name: '03 엔진 수명' }).press('Enter');
  await expect(chapter).toBeFocused();
  for (const width of [390, 1440, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole('link', { name: '03 엔진 수명' }).press('Enter');
    await expect.poll(() => chapter.evaluate(el => Math.round(el.getBoundingClientRect().top))).toBeGreaterThanOrEqual(0);
    await expect.poll(() => chapter.evaluate(el => Math.round(el.getBoundingClientRect().top))).toBeLessThanOrEqual(140);
    await expect(current).toHaveAttribute('href', '#engine');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
