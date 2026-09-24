import { expect, test } from '@playwright/test';

const SITE_TITLE = 'Dave Biehl Art';

const pages = [
  { path: '/', title: SITE_TITLE },
  { path: '/contact', title: `Contact | ${SITE_TITLE}` },
  { path: '/privacy-policy', title: `Privacy Policy | ${SITE_TITLE}` },
  { path: '/terms-of-use', title: `Terms of Use | ${SITE_TITLE}` },
  { path: '/this-page-does-not-exist', title: `Not Found | ${SITE_TITLE}` },
];

for (const { path, title } of pages) {
  test(`${path} renders with title "${title}"`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('app-navigation')).toBeAttached();
  });
}
