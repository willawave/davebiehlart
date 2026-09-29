import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';

// Runs against the emulator seed in emulator-data/: 12 visible statues (seed-statue-01 is
// the most recently dedicated) and one hidden one, "Unfinished Study".
const cardNames = (page: Page) => page.locator('main a.card .name');

// WCAG 2.1 A/AA.
async function expectNoAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
}

// Where a bronze pin (or cluster) is drawn on the map, in page coordinates. The map's tiles
// are blocked in these tests, so the pins are the only bronze on its canvases.
function findPin(page: Page): Promise<{ x: number; y: number } | null> {
  return page.evaluate(() => {
    for (const canvas of Array.from(document.querySelectorAll('app-multi-point-map canvas'))) {
      const c = canvas as HTMLCanvasElement;
      const context = c.getContext('2d');
      if (!context || !c.width || !c.height) continue;
      const { data } = context.getImageData(0, 0, c.width, c.height);
      for (let i = 0; i < data.length; i += 4) {
        const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
        if (a > 250 && Math.abs(r - 122) < 6 && Math.abs(g - 74) < 6 && Math.abs(b - 30) < 6) {
          const rect = c.getBoundingClientRect();
          const scale = rect.width / c.width;
          const pixel = i / 4;
          return {
            x: rect.left + (pixel % c.width) * scale,
            y: rect.top + Math.floor(pixel / c.width) * scale,
          };
        }
      }
    }
    return null;
  });
}

test.beforeEach(async ({ page }) => {
  // No OpenStreetMap tiles: tests stay offline-safe, and pins are easy to find.
  await page.route(/tile\.openstreetmap\.org/, (route) => route.abort());
});

test.describe('list', () => {
  test('shows only visible statues, most recently dedicated first', async ({ page }) => {
    await page.goto('/statues');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Statues');
    await expect(cardNames(page)).toHaveCount(12);
    await expect(cardNames(page).first()).toHaveText('The Pioneer Family');
    await expect(cardNames(page).last()).toHaveText('Buffalo Crossing');
    await expect(page.locator('main')).not.toContainText('Unfinished Study');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Public bronze statues by artist Dave Biehl, and where to find them.',
    );
  });

  test('is server-rendered with the grid and the map’s box', async ({ request }) => {
    const html = await (await request.get('/statues')).text();
    expect(html).toContain('The Pioneer Family');
    expect(html).toContain('aria-label="Map of statue locations.');
    expect(html).toContain('statue:all');
    expect(html).not.toContain('Unfinished Study');
  });

  test('a map pin opens its statue', async ({ page }) => {
    await page.goto('/statues');
    const map = page.getByRole('region', { name: /Map of statue locations/ });
    await expect(map.locator('canvas').first()).toBeVisible();

    // Crowded pins are clustered; each click on one zooms in, until a lone pin opens.
    for (let attempt = 0; attempt < 6 && page.url().endsWith('/statues'); attempt++) {
      await expect.poll(() => findPin(page)).not.toBeNull();
      const pin = await findPin(page);
      if (!pin) break;
      await page.mouse.click(pin.x + 2, pin.y + 4);
      await page.waitForTimeout(500);
    }
    await expect(page).toHaveURL(/\/statues\/seed-statue-\d\d$/);
    await expect(page.getByRole('heading', { name: 'Location' })).toBeVisible();
  });

  test('passes axe with the map loaded', async ({ page }) => {
    await page.goto('/statues');
    await expect(page.locator('app-multi-point-map .ol-viewport')).toBeVisible();
    await expectNoAxeViolations(page);
  });

  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 390, height: 844 },
  ]) {
    for (const path of ['/statues', '/statues/seed-statue-03']) {
      test(`${path} at ${viewport.width}px loads its largest photo eagerly`, async ({ page }) => {
        const warnings: string[] = [];
        page.on('console', (message) => {
          const text = message.text();
          if (/NG02955|NG0913[\s\S]*Largest Contentful Paint/.test(text)) warnings.push(text);
        });
        await page.setViewportSize(viewport);
        await page.goto(path, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        expect(warnings).toEqual([]);
      });
    }
  }
});

test.describe('detail', () => {
  test('is server-rendered with the statue, its title, address and share tags', async ({
    request,
  }) => {
    const response = await request.get('/statues/seed-statue-03');
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain('<title>The Scout | Statues | Dave Biehl Art</title>');
    expect(html).toMatch(/<h1[^>]*>The Scout<\/h1>/);
    expect(html).toContain('Elmwood Park');
    expect(html).toMatch(
      /<meta property="og:image" content="http:\/\/127\.0\.0\.1:9199\/[^"]*seed-statue-03-key/,
    );
    expect(html).toContain('statue:item:seed-statue-03');
    expect(html).toMatch(/<a[^>]*rel="prev"[^>]*href="\/statues\/seed-statue-02"/);
    expect(html).toMatch(/<a[^>]*rel="next"[^>]*href="\/statues\/seed-statue-04"/);
  });

  test('opens from its card with photos of every shape, the address and a map', async ({
    page,
  }) => {
    await page.goto('/statues');
    await page.getByRole('link', { name: /The Scout/ }).click();

    await expect(page).toHaveURL('/statues/seed-statue-03');
    await expect(page).toHaveTitle('The Scout | Statues | Dave Biehl Art');
    await expect(page.locator('.kicker')).toHaveText(/Statue · Dedicated June 2019/i);
    await expect(
      page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('listitem'),
    ).toHaveText(['Home', 'Statues', 'The Scout']);
    await expect(page.locator('address')).toContainText('Elmwood Park');
    await expect(page.locator('address')).toContainText('Omaha, Nebraska');

    const photos = page.getByRole('button', { name: /The Scout, photo \d of 4, view full size/ });
    await expect(photos).toHaveCount(4);
    await photos.nth(2).click();
    const dialog = page.getByRole('dialog', { name: 'The Scout' });
    await expect(dialog.getByRole('img')).toHaveAttribute('alt', 'The Scout, photo 3 of 4');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    const map = page.getByRole('region', { name: 'Map showing where The Scout stands' });
    await expect(map.locator('.ol-viewport')).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('previous and next walk the statues in list order', async ({ page }) => {
    const pager = page.getByRole('navigation', { name: 'More statues' });
    await page.goto('/statues/seed-statue-01');
    await expect(pager.getByRole('link', { name: /Previous/ })).toHaveCount(0);

    await pager.getByRole('link', { name: /Next.*Spirit of the Prairie/ }).click();
    await expect(page).toHaveURL('/statues/seed-statue-02');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Spirit of the Prairie');
    await expect(page.locator('address')).toContainText('Heartland of America Park');

    await page.goto('/statues/seed-statue-12');
    await expect(pager.getByRole('link', { name: /Next/ })).toHaveCount(0);
  });

  test('leaves out a missing street', async ({ page }) => {
    await page.goto('/statues/seed-statue-07');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('The Homesteader');
    await expect(page.locator('address span')).toHaveText([
      'Courthouse Square',
      'Beatrice, Nebraska',
    ]);
  });

  for (const path of ['/statues/seed-statue-hidden', '/statues/seed-bronze-01']) {
    test(`${path} is not found`, async ({ request, page }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(404);
      expect(await response.text()).not.toContain('Unfinished Study');

      await page.goto(path);
      await expect(page).toHaveURL(path);
      await expect(page).toHaveTitle(/^Not Found/);
    });
  }
});
