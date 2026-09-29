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

const staticPages = [
  { path: '/contact', heading: 'Contact' },
  { path: '/privacy-policy', heading: 'Privacy Policy' },
  { path: '/terms-of-use', heading: 'Terms of Use' },
  { path: '/this-page-does-not-exist', heading: 'Page not found' },
];

for (const { path, heading } of staticPages) {
  test(`${path} shows its "${heading}" content`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  });
}

test('the contact page links to email and phone', async ({ page }) => {
  await page.goto('/contact');
  await expect(page.getByRole('link', { name: 'dave.hvs50@gmail.com' })).toHaveAttribute(
    'href',
    /^mailto:dave\.hvs50@gmail\.com/,
  );
  await expect(page.getByRole('link', { name: '(402) 460-0703' })).toHaveAttribute(
    'href',
    'tel:+14024600703',
  );
});

test('the not-found page leads back into the site', async ({ page }) => {
  await page.goto('/this-page-does-not-exist');
  await page.getByRole('link', { name: 'Go to the home page' }).click();
  await expect(page).toHaveURL('/');
});
