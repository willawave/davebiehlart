import { expect, test } from '@playwright/test';
import sharp from 'sharp';

// Photos come resized through the web server's /img endpoint, so a phone downloads card-sized
// copies instead of every full upload.

async function firstPhoto(request: import('@playwright/test').APIRequestContext) {
  const html = await (await request.get('/bronzes/seed-bronze-01')).text();
  const src = html.match(/srcset="\/img\?src=([^&"]+)&amp;w=/)?.[1];
  expect(src, 'the detail strip offers resized copies').toBeTruthy();
  return decodeURIComponent(src!);
}

test('/img returns a smaller WebP at the requested width, cached for a year', async ({
  request,
}) => {
  const photo = await firstPhoto(request);
  const original = await (await request.get(photo)).body();

  const response = await request.get(`/img?src=${encodeURIComponent(photo)}&w=320`);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toBe('image/webp');
  expect(response.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
  const resized = await response.body();
  expect(resized.length).toBeLessThan(original.length);
  expect((await sharp(resized).metadata()).width).toBe(320);
});

test('/img refuses other hosts and unlisted widths', async ({ request }) => {
  const photo = await firstPhoto(request);
  const foreign = await request.get(
    `/img?src=${encodeURIComponent('https://example.com/v0/b/x/o/a.jpg')}&w=320`,
  );
  expect(foreign.status()).toBe(400);
  expect(foreign.headers()['cache-control']).toBe('no-store');
  expect((await request.get(`/img?src=${encodeURIComponent(photo)}&w=333`)).status()).toBe(400);
});

test('/img answers 404, uncached, for a photo that is gone', async ({ request }) => {
  const photo = new URL(await firstPhoto(request));
  photo.pathname = photo.pathname.replace(/[^/]+$/, 'no-such-photo.jpg');
  const response = await request.get(`/img?src=${encodeURIComponent(photo.href)}&w=320`);
  expect(response.status()).toBe(404);
  expect(response.headers()['cache-control']).toBe('no-store');
});

test('on a phone, the grid loads resized copies, never the full uploads', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const originals: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'image' && request.url().includes('/v0/b/')) {
      originals.push(request.url());
    }
  });
  await page.goto('/bronzes');
  const card = page.locator('main a.card img').first();
  await expect(card).toHaveAttribute('srcset', /\/img\?src=.*&w=320 320w/);
  await expect
    .poll(() => card.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true);
  expect(await card.evaluate((img: HTMLImageElement) => img.currentSrc)).toContain('/img?src=');
  expect(originals).toEqual([]);
});
