import { expect, Page, test } from '@playwright/test';

// Runs against the emulator seed in emulator-data/: 12 visible bronzes, 9 visible kiln
// glass pieces, and one hidden item of each style.
const FIRESTORE_EMULATOR = '127.0.0.1:8080';

const cardNames = (page: Page) => page.locator('main a.card .name');

// Firestore calls the browser makes (server-side reads never show up here).
function recordFirestoreRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes(FIRESTORE_EMULATOR)) urls.push(request.url());
  });
  return urls;
}

test.describe('lists', () => {
  test('/bronzes shows only visible bronzes, newest first', async ({ page }) => {
    await page.goto('/bronzes');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bronzes');
    await expect(cardNames(page)).toHaveCount(12);
    await expect(cardNames(page).first()).toHaveText('Mustang at Dawn');
    await expect(cardNames(page).last()).toHaveText('Bugler Elk');
    await expect(page.locator('main')).not.toContainText('Hidden Draft');
    await expect(page.locator('main')).not.toContainText('Amber Bowl');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Bronze sculptures by artist Dave Biehl.',
    );
  });

  test('/glass shows only visible kiln glass', async ({ page }) => {
    await page.goto('/glass');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kiln Glass');
    await expect(cardNames(page)).toHaveCount(9);
    await expect(cardNames(page).first()).toHaveText('Amber Bowl');
    await expect(page.locator('main')).not.toContainText('Mustang at Dawn');
  });

  test('switching sections never shows the other style', async ({ page }) => {
    await page.goto('/bronzes');
    await expect(cardNames(page)).toHaveCount(12);
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Kiln Glass' })
      .click();
    await expect(page).toHaveURL('/glass');
    await expect(cardNames(page)).toHaveCount(9);
    await expect(page.locator('main')).not.toContainText('Mustang at Dawn');
  });

  test('the browser reuses server-rendered data, then reads Firestore itself', async ({ page }) => {
    const requests = recordFirestoreRequests(page);
    await page.goto('/bronzes');
    await page.waitForFunction(() => !document.querySelector('[ngh]'));
    await expect(cardNames(page)).toHaveCount(12);
    expect(requests).toEqual([]);

    // After hydration, client-side navigation reads Firestore directly.
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Kiln Glass' })
      .click();
    await expect(cardNames(page)).toHaveCount(9);
    expect(requests.length).toBeGreaterThan(0);
  });
});

test.describe('largest contentful paint', () => {
  // Development builds check the page's largest paint: a lazy or non-priority image there
  // logs NG02955 / NG0913. Any above-the-fold photo can be the largest.
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 1920, height: 1080 },
    { width: 390, height: 844 },
  ]) {
    for (const path of ['/bronzes', '/glass', '/bronzes/seed-bronze-01']) {
      test(`${path} at ${viewport.width}px loads its largest photo eagerly`, async ({ page }) => {
        const warnings: string[] = [];
        page.on('console', (message) => {
          const text = message.text();
          if (/NG02955|NG0913[\s\S]*Largest Contentful Paint/.test(text)) warnings.push(text);
        });
        await page.setViewportSize(viewport);
        await page.goto(path, { waitUntil: 'networkidle' });
        // Angular reports once the browser settles the largest paint.
        await page.waitForTimeout(1000);
        expect(warnings).toEqual([]);
      });
    }
  }
});

test.describe('detail', () => {
  test('is server-rendered with the item, its title, and share tags', async ({ request }) => {
    const response = await request.get('/bronzes/seed-bronze-01');
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain('<title>Mustang at Dawn | Bronzes | Dave Biehl Art</title>');
    expect(html).toMatch(/<h1[^>]*>Mustang at Dawn<\/h1>/);
    expect(html).toMatch(
      /<meta name="description" content="Mustang at Dawn, a bronze by Dave Biehl: Mustang at Dawn is sample data/,
    );
    expect(html).toMatch(
      /<meta property="og:image" content="http:\/\/127\.0\.0\.1:9199\/[^"]*seed-bronze-01-key/,
    );
    // The transfer state carries the item to the browser.
    expect(html).toContain('gallery:item:seed-bronze-01');
  });

  test('opens from its card and shows its photos, date and dimensions', async ({ page }) => {
    await page.goto('/bronzes');
    await page.getByRole('link', { name: /Mustang at Dawn/ }).click();

    await expect(page).toHaveURL('/bronzes/seed-bronze-01');
    await expect(page).toHaveTitle('Mustang at Dawn | Bronzes | Dave Biehl Art');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mustang at Dawn');
    await expect(page.locator('.kicker')).toHaveText(/Bronze · Created January 2024/i);
    await expect(page.locator('main dl')).toContainText('Weight');
    await expect(
      page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('listitem'),
    ).toHaveText(['Home', 'Bronzes', 'Mustang at Dawn']);

    const photos = page.getByRole('button', {
      name: /Mustang at Dawn, photo \d of 3, view full size/,
    });
    await expect(photos).toHaveCount(3);
    await photos.nth(1).click();
    const dialog = page.getByRole('dialog', { name: 'Mustang at Dawn' });
    await expect(dialog.getByRole('img')).toHaveAttribute('alt', 'Mustang at Dawn, photo 2 of 3');
    await page.keyboard.press('ArrowRight');
    await expect(dialog.getByRole('img')).toHaveAttribute('alt', 'Mustang at Dawn, photo 3 of 3');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(photos.nth(1)).toBeFocused();
  });

  test('previous and next walk the section in list order', async ({ page }) => {
    const pager = page.getByRole('navigation', { name: 'More bronzes' });
    await page.goto('/bronzes/seed-bronze-01');
    // The newest bronze has nothing before it.
    await expect(pager.getByRole('link', { name: /Previous/ })).toHaveCount(0);

    await pager.getByRole('link', { name: /Next.*The Herd/ }).click();
    await expect(page).toHaveURL('/bronzes/seed-bronze-02');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('The Herd');
    await expect(page).toHaveTitle('The Herd | Bronzes | Dave Biehl Art');

    await pager.getByRole('link', { name: /Previous.*Mustang at Dawn/ }).click();
    await expect(page).toHaveURL('/bronzes/seed-bronze-01');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mustang at Dawn');

    // The oldest has nothing after it.
    await page.goto('/bronzes/seed-bronze-12');
    await expect(pager.getByRole('link', { name: /Previous.*Pronghorn/ })).toBeVisible();
    await expect(pager.getByRole('link', { name: /Next/ })).toHaveCount(0);
  });

  test('previous/next links are server-rendered, and hydration fetches nothing', async ({
    page,
    request,
  }) => {
    const html = await (await request.get('/glass/seed-glass-02')).text();
    expect(html).toMatch(/<a[^>]*rel="prev"[^>]*href="\/glass\/seed-glass-01"/);
    expect(html).toMatch(/<a[^>]*rel="next"[^>]*href="\/glass\/seed-glass-03"/);

    const requests = recordFirestoreRequests(page);
    await page.goto('/glass/seed-glass-02');
    await page.waitForFunction(() => !document.querySelector('[ngh]'));
    await expect(
      page.getByRole('navigation', { name: 'More kiln glass' }).getByRole('link'),
    ).toHaveCount(2);
    expect(requests).toEqual([]);
  });

  test('leaves out the weight when there is none', async ({ page }) => {
    await page.goto('/bronzes/seed-bronze-09');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Coyote Moon');
    await expect(page.locator('main dl')).not.toContainText('Weight');
  });

  for (const path of [
    '/bronzes/seed-bronze-hidden',
    '/glass/seed-glass-hidden',
    '/glass/seed-bronze-01',
    '/bronzes/no-such-item',
  ]) {
    test(`${path} is not found`, async ({ request, page }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(404);
      const html = await response.text();
      // Hidden drafts never reach the page, not even in the transfer state.
      expect(html).not.toContain('Hidden Draft');

      await page.goto(path);
      await expect(page).toHaveURL(path);
      await expect(page).toHaveTitle(/^Not Found/);
    });
  }

  test('a client-side visit to a missing item keeps its URL and history entry', async ({
    page,
  }) => {
    await page.goto('/bronzes');
    await page.waitForFunction(() => !document.querySelector('[ngh]'));
    // Like clicking a stale card: route in-app, through the app's own router (dev mode
    // exposes components via the `ng` global; the breadcrumb holds the Router).
    await page.evaluate(() => {
      const ng = (window as unknown as { ng: { getComponent(el: Element): unknown } }).ng;
      const breadcrumb = ng.getComponent(document.querySelector('app-breadcrumb') as Element) as {
        router: { navigateByUrl(url: string): Promise<boolean> };
      };
      return breadcrumb.router.navigateByUrl('/bronzes/no-such-item');
    });

    await expect(page).toHaveURL('/bronzes/no-such-item');
    await expect(page).toHaveTitle(/^Not Found/);
    await page.goBack();
    await expect(page).toHaveURL('/bronzes');
    await expect(page.locator('main a.card')).toHaveCount(12);
  });
});
