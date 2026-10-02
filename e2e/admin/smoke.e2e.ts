import { expect, test } from '@playwright/test';

test('the sign-in page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Sign In');
});

test('the admin app serves the shared favicon set and its own manifest', async ({ request }) => {
  for (const path of [
    '/favicon.ico',
    '/icon.svg',
    '/mark.svg',
    '/apple-touch-icon.png',
    '/apple-touch-icon-precomposed.png',
  ]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
  const manifest = await request.get('/manifest.webmanifest');
  expect(manifest.status()).toBe(200);
  expect((await manifest.json()).name).toBe('Dave Biehl Art Admin');
});

test('the admin bar shows the lockup and no fonts load from Google', async ({ page }) => {
  const googleRequests: string[] = [];
  page.on('request', (request) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(request.url())) {
      googleRequests.push(request.url());
    }
  });

  await page.goto('/');
  await expect(page.locator('header .dba-mark')).toBeVisible();
  await expect(page.locator('header .dba-wordmark')).toHaveText('Dave Biehl Art');
  await page.evaluate(() => document.fonts.ready);
  expect(googleRequests).toEqual([]);
});

test('the admin app asks search engines not to index it', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});
