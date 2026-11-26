import { expect, test } from '@playwright/test';
import portfolio from '../../src/data/portfolio.json' with { type: 'json' };

test.beforeEach(async ({ page }) => {
  await page.goto('./#archive');
});

test('classification and highlights read without a click', async ({ page }) => {
  for (const { label } of portfolio.otherProjectCategories) await expect(page.locator('#archive').getByRole('heading', { level: 3, name: new RegExp(`^${label}`) })).toBeVisible();
  await expect(page.locator('#archive .work-row')).toHaveCount(portfolio.otherProjects.length);
  await expect(page.locator('#dropout .work-highlight')).toContainText('89%');
  await expect(page.locator('#dropout .work-type')).toBeVisible();
});

test('hovering a row keeps its columns aligned', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Touch has no hover.');
  const before = await page.locator('#arxiv .work-title').boundingBox();
  await page.locator('#arxiv > summary').hover();
  await page.waitForTimeout(400);
  const after = await page.locator('#arxiv .work-title').boundingBox();
  expect(after!.x).toBeCloseTo(before!.x, 0);
});

test('hovering a row shows what it holds, and opening it hands over', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Touch has no hover.');
  const card = page.locator('.work-preview');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#vit > summary').scrollIntoViewIfNeeded();
  await page.locator('#vit > summary').hover();
  await expect(card).toHaveClass(/is-visible/);
  await expect(card.locator('p')).toHaveText((await page.locator('#vit .work-body p').textContent())!);
  await expect(card.locator('img')).toHaveJSProperty('complete', true);
  const box = await card.boundingBox();
  const viewport = page.viewportSize()!;
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
  await page.locator('#vit > summary').click();
  await expect(card).not.toHaveClass(/is-visible/);
  await page.mouse.move(0, 0);
  await expect(page.locator('#arxiv > summary')).toHaveCSS('opacity', '1');
});

test('paper wording replaces screen wording', async ({ page }) => {
  await expect(page.locator('.print-text').first()).toBeHidden();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.print-text').first()).toBeVisible();
  await expect(page.locator('.screen-text').first()).toBeHidden();
  await expect(page.locator('.hero-print-card')).toBeVisible();
});

test('A4 print stays portrait within its page budget', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium' || testInfo.project.name !== 'chromium-1440', 'One PDF render is enough.');
  await page.locator('#archive').evaluate(el => el.scrollIntoView());
  const pdf = (await page.pdf({ preferCSSPageSize: true, printBackground: true })).toString('latin1');
  const pages = pdf.match(/\/Type\s*\/Page\b/g)!.length;
  expect(pages).toBeLessThanOrEqual(19); // 11 archive rows after the 2026 shipped apps joined
  expect(pdf).toMatch(/\/MediaBox\s*\[\s*0 0 59[45](\.\d+)? 84[12]/);
});

test('each case shows what the project is beside its title', async ({ page }) => {
  for (const id of ['nutrition', 'agriculture', 'engine']) {
    const visual = page.locator(`#${id} .case-visual`);
    await visual.scrollIntoViewIfNeeded();
    await expect(visual.locator('.visual-front')).toBeVisible();
    await expect(visual.locator('.visual-back')).toHaveCount(1);
  }
  const pictures = page.locator('.case-visual img');
  for (let i = 0; i < await pictures.count(); i++) await expect(pictures.nth(i)).not.toHaveAttribute('alt', '');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test('the case picture leaves the brief on the first screen', async ({ page }) => {
  await page.locator('#engine .case-head').evaluate(el => window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 20, behavior: 'instant' }));
  const brief = await page.locator('#engine .case-brief').boundingBox();
  const viewport = page.viewportSize()!;
  expect(brief!.y).toBeLessThan(viewport.height * 0.75);
  if (viewport.width > 760) {
    const title = await page.locator('#engine .case-title').boundingBox();
    const visual = await page.locator('#engine .case-visual').boundingBox();
    expect(visual!.x).toBeGreaterThanOrEqual(title!.x + title!.width - 1);
  }
});

test('case pictures stay clear of the text around them at any width', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 390, 480, 599, 600, 680, 760, 761, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const gaps = await page.evaluate(() => ['nutrition', 'agriculture', 'engine'].map(id => {
      const chapter = document.getElementById(id)!;
      const box = (selector: string) => chapter.querySelector(selector)?.getBoundingClientRect();
      const cards = [...chapter.querySelectorAll('.visual-card')].map(card => card.getBoundingClientRect());
      const touches = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      return {
        id,
        covered: ['.case-question', '.case-name', '.case-visual figcaption', '.case-brief']
          .filter(selector => {
            const b = box(selector);
            return b ? cards.some(card => touches(card, b)) : false;
          }),
      };
    }));
    for (const gap of gaps) expect(gap.covered, `${gap.id} at ${width}px`).toEqual([]);
  }
});
