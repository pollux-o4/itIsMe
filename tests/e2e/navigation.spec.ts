import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'no-preference' });

declare global { interface Window { scrollSamples: number[] } }

test('masthead hides on downward reading and returns upward or for keyboard focus', async ({ page }) => {
  await page.goto('./');
  const masthead = page.locator('.masthead');
  await expect(page.locator('.reading-progress span')).toHaveAttribute('style', /scaleX/);
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
  await expect(masthead).toHaveClass(/is-scroll-hidden/);
  await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }));
  await expect(masthead).not.toHaveClass(/is-scroll-hidden/);
  await page.getByRole('link', { name: '03 엔진 수명' }).focus();
  await page.evaluate(() => window.scrollTo({ top: 950, behavior: 'instant' }));
  await expect(masthead).not.toHaveClass(/is-scroll-hidden/);
});

test('anchor motion is gradual and still reaches its target when resized mid-scroll', async ({ page }) => {
  await page.goto('./');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('smooth');
  await page.evaluate(() => {
    window.scrollSamples = [];
    document.querySelector<HTMLAnchorElement>('.story-nav a[href="#engine"]')!.addEventListener('click', () => {
      function sample() {
        window.scrollSamples.push(scrollY);
        if (window.scrollSamples.length < 4) requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    }, { once: true });
  });
  await page.getByRole('link', { name: '03 엔진 수명' }).press('Enter');
  await expect.poll(() => page.evaluate(() => window.scrollSamples.length)).toBe(4);
  const samples = await page.evaluate(() => window.scrollSamples);
  expect(new Set(samples.map(Math.round)).size).toBeGreaterThan(1);
  await page.setViewportSize({ width: 390, height: 900 });
  const target = page.locator('#engine');
  await expect.poll(() => target.evaluate(el => Math.round(el.getBoundingClientRect().top))).toBeGreaterThanOrEqual(0);
  await expect.poll(() => target.evaluate(el => Math.round(el.getBoundingClientRect().top))).toBeLessThanOrEqual(140);
  await expect(target).toBeFocused();
});
