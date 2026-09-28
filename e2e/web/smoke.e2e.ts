import { expect, test } from '@playwright/test';

const SITE_TITLE = 'Dave Biehl Art';

const pages = [
  { path: '/', title: SITE_TITLE, status: 200, page: 'app-home-page' },
  { path: '/contact', title: `Contact | ${SITE_TITLE}`, status: 200, page: 'app-contact-page' },
  {
    path: '/privacy-policy',
    title: `Privacy Policy | ${SITE_TITLE}`,
    status: 200,
    page: 'app-privacy-policy-page',
  },
  {
    path: '/terms-of-use',
    title: `Terms of Use | ${SITE_TITLE}`,
    status: 200,
    page: 'app-terms-of-use-page',
  },
  {
    path: '/this-page-does-not-exist',
    title: `Not Found | ${SITE_TITLE}`,
    status: 404,
    page: 'app-not-found-page',
  },
];

for (const { path, title, status, page: pageSelector } of pages) {
  test(`${path} renders with title "${title}" and HTTP ${status}`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(status);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('app-navigation')).toBeAttached();
    await expect(page.locator(`main ${pageSelector}`)).toBeAttached();
  });
}
