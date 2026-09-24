import { expect, test } from '@playwright/test';

const SITE_TITLE = 'Dave Biehl Art';

const pages = [
  { path: '/', title: SITE_TITLE, status: 200 },
  { path: '/contact', title: `Contact | ${SITE_TITLE}`, status: 200 },
  { path: '/privacy-policy', title: `Privacy Policy | ${SITE_TITLE}`, status: 200 },
  { path: '/terms-of-use', title: `Terms of Use | ${SITE_TITLE}`, status: 200 },
  // NotFoundPage sets a 404 via RESPONSE_INIT, but the navigation shell has no
  // <router-outlet> yet, so no routed page renders on the server. Change this to 404 once
  // the shell renders routes.
  { path: '/this-page-does-not-exist', title: `Not Found | ${SITE_TITLE}`, status: 200 },
];

for (const { path, title, status } of pages) {
  test(`${path} renders with title "${title}" and HTTP ${status}`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(status);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('app-navigation')).toBeAttached();
  });
}
