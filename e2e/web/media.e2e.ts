import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';

// The emulator seed holds 12 visible media items, newest first: seed-media-01 "On Air at
// the Foundry" (a video) and seed-media-02 "The Sculptor Next Door" (an article on
// example.com), plus the hidden seed-media-hidden "Unpublished Interview".

// WCAG 2.1 A/AA. The YouTube player is a third-party frame, not the site's markup.
async function expectNoAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('.player iframe')
    .analyze();
  expect(results.violations).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  // No YouTube stills or player: the seed's video IDs are made up, and tests stay offline-safe.
  await page.route(/i\.ytimg\.com|youtube-nocookie\.com/, (route) => route.abort());
});

test('the list mixes videos and articles, newest first, without hidden items', async ({
  page,
  request,
}) => {
  const response = await request.get('/media');
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('On Air at the Foundry');
  expect(html).not.toContain('Unpublished Interview');

  await page.goto('/media');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Media');
  const rows = page.getByRole('list', { name: 'Videos and articles' }).getByRole('link');
  await expect(rows).toHaveCount(12);
  await expect(rows.nth(0)).toContainText('On Air at the Foundry');
  await expect(rows.nth(0)).toContainText('Video · September 12, 2026');
  await expect(rows.nth(1)).toContainText('The Sculptor Next Door');
  await expect(rows.nth(1)).toContainText('Article · example.com · August 3, 2026');
  await expect(page.locator('main')).not.toContainText('Unpublished Interview');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'Videos and press coverage of sculptor Dave Biehl and his bronze work.',
  );
  await expectNoAxeViolations(page);

  await rows.nth(1).click();
  await expect(page).toHaveURL('/media/seed-media-02');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The Sculptor Next Door');
});

test('a video plays on its own page', async ({ page, request }) => {
  const response = await request.get('/media/seed-media-01');
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('<title>On Air at the Foundry | Media | Dave Biehl Art</title>');
  expect(html).toContain('https://i.ytimg.com/vi/Sd8Kq2LmN4a/hqdefault.jpg');

  await page.goto('/media/seed-media-01');
  await expect(page.locator('.kicker')).toHaveText('Video · September 12, 2026');
  await expect(
    page.locator('iframe[title="On Air at the Foundry (YouTube video)"]'),
  ).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/Sd8Kq2LmN4a');
  await expectNoAxeViolations(page);
});

test('a video saved as a youtu.be link still plays', async ({ page }) => {
  await page.goto('/media/seed-media-03');
  await expect(page.locator('.player iframe')).toHaveAttribute(
    'src',
    'https://www.youtube-nocookie.com/embed/Hx3Vb7QpR2c',
  );
});

test('an article links out to the publication in a new tab', async ({ page }) => {
  await page.goto('/media/seed-media-02');
  await expect(page.locator('.kicker')).toHaveText('Article · example.com · August 3, 2026');
  await expect(page.locator('iframe')).toHaveCount(0);
  const link = page.getByRole('link', { name: /Read on example\.com/ });
  await expect(link).toHaveAttribute('href', 'https://www.example.com/arts/the-sculptor-next-door');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  await expectNoAxeViolations(page);
});

for (const path of ['/media/seed-media-hidden', '/media/seed-event-01']) {
  test(`${path} is not found`, async ({ request, page }) => {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain('Unpublished Interview');

    await page.goto(path);
    await expect(page).toHaveURL(path);
    await expect(page).toHaveTitle(/^Not Found/);
  });
}
