import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from '../admin/helpers';

// Every public page passes axe in both color schemes, at desktop and phone widths. Other
// suites check behavior (focus, dialogs, the menu); this one catches a contrast or labeling
// regression on any page.
const ROUTES = [
  '/',
  '/bronzes',
  '/bronzes/seed-bronze-01',
  '/glass',
  '/glass/seed-glass-01',
  '/statues',
  '/statues/seed-statue-01',
  '/events',
  '/events/seed-event-01',
  '/media',
  '/media/seed-media-01',
  '/contact',
  '/privacy-policy',
  '/terms-of-use',
  '/no-such-page',
];

for (const [width, viewport] of [
  ['desktop', { width: 1280, height: 900 }],
  ['phone', { width: 390, height: 844 }],
] as const) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`every page passes axe on ${width} in ${colorScheme} mode`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize(viewport);
      // Reduced motion: sections that rise into view would otherwise be measured mid-fade.
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      for (const route of ROUTES) {
        await test.step(route, async () => {
          await page.goto(route);
          await expect(page.locator('main h1')).toBeVisible();
          await expectNoAxeViolations(page);
        });
      }
    });
  }
}
