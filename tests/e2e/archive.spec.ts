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
