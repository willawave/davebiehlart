import { expect, test } from '@playwright/test';

const ICONS = [
  '/favicon.ico',
  '/icon.svg',
  '/mark.svg',
  '/apple-touch-icon.png',
  '/apple-touch-icon-precomposed.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/manifest.webmanifest',
  '/og-image.png',
];

test('serves the favicon set, manifest and OG image', async ({ request }) => {
  for (const path of ICONS) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }
});

test('links the icons and describes the site for social previews', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute(
    'href',
    '/icon.svg',
  );
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    '/manifest.webmanifest',
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://davebiehlart.com/og-image.png',
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  );
});

test('shows the lockup and loads no fonts from Google', async ({ page }) => {
  const googleRequests: string[] = [];
  page.on('request', (request) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(request.url())) {
      googleRequests.push(request.url());
    }
  });

  await page.goto('/');
  await expect(page.locator('.masthead .dba-mark')).toBeVisible();
  await expect(page.locator('.masthead .brand')).toHaveAccessibleName('Dave Biehl Art');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('600 16px "Cormorant Garamond"'))).toBe(
    true,
  );
  expect(googleRequests).toEqual([]);
});
