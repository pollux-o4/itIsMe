import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('./#archive');
});

test('classification and highlights read without a click', async ({ page }) => {
  for (const name of [/비전/, /분석/, /생산성/]) await expect(page.locator('#archive').getByRole('heading', { level: 3, name })).toBeVisible();
  await expect(page.locator('#archive .work-row')).toHaveCount(6);
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
  expect(pages).toBeLessThanOrEqual(18);
  expect(pdf).toMatch(/\/MediaBox\s*\[\s*0 0 59[45](\.\d+)? 84[12]/);
});
