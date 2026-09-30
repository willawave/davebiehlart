import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';

// WCAG 2.1 A/AA.
async function expectNoAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
}

test('the hero links to the bronzes and to Contact', async ({ page }) => {
  await page.goto('/');
  const main = page.locator('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(
    'Shaped by the Nebraska plains.',
  );

  await main.getByRole('link', { name: 'See the bronzes' }).click();
  await expect(page).toHaveURL('/bronzes');

  await page.goBack();
  await main.getByRole('link', { name: 'Commission a piece' }).click();
  await expect(page).toHaveURL('/contact');
});

test('the explore list reaches each section', async ({ page }) => {
  await page.goto('/');
  const explore = page.getByRole('navigation', { name: 'Explore' });
  await explore.getByRole('link', { name: /Kiln Glass/ }).click();
  await expect(page).toHaveURL('/glass');
});

test('with reduced motion, nothing moves and every section shows', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('app-home-hero h1')).toHaveCSS('animation-name', 'none');
  for (const heading of ['From clay to bronze', 'Where to see it', 'Explore']) {
    const element = page.getByRole('heading', { name: heading, exact: true });
    await element.scrollIntoViewIfNeeded();
    await expect(element).toBeVisible();
  }
  await expect(page.getByText('Henry Doorly Zoo')).toBeVisible();
});

// Regression: ISSUE-001 — dark bands blended into the page in dark mode
// Found by /qa on 2026-09-29
// Report: .gstack/qa-reports/run-20260930T005525Z/qa-report-localhost-2026-09-29.md
test('the dark bands stand apart from the page in dark mode too', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/');
  const pageBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  for (const band of ['app-home-hero', 'app-home-places section', 'app-home-explore .commission']) {
    const background = await page
      .locator(band)
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(background, band).not.toBe(pageBackground);
  }
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`has no accessibility violations in ${colorScheme} mode`, async ({ page }) => {
    // Axe reads colors mid-animation otherwise.
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('/');
    await expectNoAxeViolations(page);
  });
}
