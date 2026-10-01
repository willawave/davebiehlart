import { expect, test } from '@playwright/test';
import { ADMIN, expectNoAxeViolations, OUTSIDER, signInWithGoogle } from './helpers';

// Every admin page passes axe in both color schemes. The feature suites check the forms
// themselves; this one catches a contrast or labeling regression on any page.
const ROUTES = [
  '/dashboard',
  '/gallery',
  '/gallery-add',
  '/gallery-edit/seed-bronze-01',
  '/statues',
  '/statues-add',
  '/statues-edit/seed-statue-01',
  '/events',
  '/events-add',
  '/events-edit/seed-event-01',
  '/media',
  '/media-add',
  '/media-edit/seed-media-01',
  '/schedule',
];

for (const colorScheme of ['light', 'dark'] as const) {
  test(`every admin page passes axe in ${colorScheme} mode`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
    await expectNoAxeViolations(page);

    await signInWithGoogle(page, ADMIN);
    await page.waitForURL('**/dashboard');
    for (const route of ROUTES) {
      await test.step(route, async () => {
        // Not networkidle: Firestore keeps a connection open, so the network never idles.
        // Headings render before Firestore answers, so wait for the loaded content itself.
        await page.goto(route);
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.getByText('Loading…')).toHaveCount(0);
        if (/-(add|edit)\b|\/schedule$/.test(route)) {
          await expect(page.locator('form')).toBeVisible();
        } else if (route !== '/dashboard') {
          // A header row plus at least one seeded item.
          await expect(page.getByRole('row').nth(1)).toBeVisible();
        }
        await expectNoAxeViolations(page);
      });
    }
  });
}

test('the access-denied page passes axe', async ({ page }) => {
  await page.goto('/');
  await signInWithGoogle(page, OUTSIDER);
  await page.waitForURL('**/access-denied');
  await expect(page.locator('h1')).toBeVisible();
  await expectNoAxeViolations(page);
});
