import { expect, test } from '@playwright/test';

// Local runs are on localhost, a non-canonical host: crawlers are kept off it. The canonical
// host's robots.txt is covered by crawl.spec.ts.
test('robots.txt keeps crawlers off hosts other than davebiehlart.com', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/plain');
  expect(await response.text()).toBe('User-agent: *\nDisallow: /\n');
});

test('robots.txt is never shared from a cache, so a forged host header cannot poison it', async ({
  request,
}) => {
  const forged = await request.get('/robots.txt', {
    headers: { 'X-Forwarded-Host': 'davebiehlart.com' },
  });
  expect(forged.headers()['cache-control']).toBe('no-store');
  expect((await request.get('/robots.txt')).headers()['cache-control']).toBe('no-store');
});

test('pages on a non-canonical host tell search engines not to index them', async ({ request }) => {
  const response = await request.get('/bronzes');
  expect(response.headers()['x-robots-tag']).toBe('noindex');
});

test('sitemap.xml lists visible pages as canonical URLs and leaves hidden ones out', async ({
  request,
}) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/xml');
  const xml = await response.text();

  for (const path of [
    '/',
    '/bronzes',
    '/bronzes/seed-bronze-01',
    '/glass/seed-glass-01',
    '/statues/seed-statue-01',
    '/events/seed-event-01',
    '/media/seed-media-01',
  ]) {
    expect(xml).toContain(`<loc>https://davebiehlart.com${path}</loc>`);
  }
  for (const hidden of [
    'seed-bronze-hidden',
    'seed-glass-hidden',
    'seed-statue-hidden',
    'seed-event-hidden',
    'seed-media-hidden',
  ]) {
    expect(xml).not.toContain(hidden);
  }
});

test('llms.txt summarizes the site for language models', async ({ request }) => {
  const response = await request.get('/llms.txt');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/plain');
  expect(await response.text()).toMatch(/^# Dave Biehl Art\n/);
});

test('a detail page carries its canonical link and structured data in the server HTML', async ({
  request,
}) => {
  const html = await (await request.get('/bronzes/seed-bronze-01')).text();

  expect(html).toContain(
    '<link rel="canonical" href="https://davebiehlart.com/bronzes/seed-bronze-01">',
  );
  const blocks = Array.from(
    html.matchAll(/<script [^>]*type="application\/ld\+json"[^>]*>([^<]*)<\/script>/g),
    (match) => JSON.parse(match[1]),
  );
  expect(blocks.map((block) => block['@type']).sort()).toEqual(['BreadcrumbList', 'VisualArtwork']);
});

test('the not-found page has no canonical link', async ({ page }) => {
  await page.goto('/bronzes/seed-bronze-01');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await page.goto('/no-such-page');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});
