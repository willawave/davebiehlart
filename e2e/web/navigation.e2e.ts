import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';

const SITE_TITLE = 'Dave Biehl Art';

const sections = [
  { label: 'Bronzes', path: '/bronzes' },
  { label: 'Statues', path: '/statues' },
  { label: 'Kiln Glass', path: '/glass' },
  { label: 'Events', path: '/events' },
  { label: 'Media', path: '/media' },
  { label: 'Contact', path: '/contact' },
];

// WCAG 2.1 A/AA.
async function expectNoAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
}

test.describe('desktop', () => {
  test('the header links reach every section and mark the current one', async ({ page }) => {
    await page.goto('/');
    const header = page.getByRole('navigation', { name: 'Main' });
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden();

    for (const { label, path } of sections) {
      await header.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(path);
      await expect(page).toHaveTitle(`${label} | ${SITE_TITLE}`);
      await expect(header.getByRole('link', { name: label, exact: true })).toHaveAttribute(
        'aria-current',
        'page',
      );
    }

    await page.getByRole('link', { name: SITE_TITLE }).first().click();
    await expect(page).toHaveURL('/');
    await expect(page).toHaveTitle(SITE_TITLE);
  });

  test('the breadcrumb shows the path to a detail page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveCount(0);

    await page.goto('/bronzes/some-bronze');
    const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(breadcrumb.getByRole('listitem')).toHaveText(['Home', 'Bronzes', 'Details']);
    await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('Details');
    // The header marks the section, leaving "page" to the breadcrumb.
    const bronzes = page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Bronzes', exact: true });
    await expect(bronzes).toHaveAttribute('aria-current', 'true');

    await breadcrumb.getByRole('link', { name: 'Bronzes' }).click();
    await expect(page).toHaveURL('/bronzes');
    await expect(breadcrumb.getByRole('listitem')).toHaveText(['Home', 'Bronzes']);
  });

  test('the footer links the legal pages', async ({ page }) => {
    await page.goto('/');
    const footer = page.getByRole('contentinfo');
    await footer.getByRole('link', { name: 'Privacy Policy' }).click();
    await expect(page).toHaveURL('/privacy-policy');
    await footer.getByRole('link', { name: 'Terms of Use' }).click();
    await expect(page).toHaveURL('/terms-of-use');
    const credit = footer.getByRole('link', { name: 'Site by Willawave' });
    await expect(credit).toHaveAttribute('href', 'https://willawave.ai');
    await expect(credit).toHaveAttribute('target', '_blank');
  });

  test('keyboard navigation moves focus to the new page', async ({ page }) => {
    await page.goto('/');
    const footer = page.getByRole('contentinfo');
    await footer.getByRole('link', { name: 'Privacy Policy' }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/privacy-policy');
    await expect(page.locator('main')).toBeFocused();
  });

  test('the skip link moves focus to the main content', async ({ page }) => {
    await page.goto('/contact');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
    await expect(page).toHaveURL('/contact');
    await expect(page.locator('main app-contact-page')).toBeAttached();
  });
});

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the menu opens from the right, navigates, and closes', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden();

    const menuButton = page.getByRole('button', { name: 'Open menu' });
    await menuButton.click();
    const menu = page.getByRole('navigation', { name: 'Menu' });
    // Focus moves into the drawer once it has slid in against the right edge.
    await expect(page.getByRole('button', { name: 'Close menu' })).toBeFocused();
    await expect
      .poll(async () => {
        const box = await menu.boundingBox();
        return box && Math.round(box.x + box.width);
      })
      .toBe(390);

    await menu.getByRole('link', { name: 'Statues' }).click();
    await expect(page).toHaveURL('/statues');
    await expect(menu).toBeHidden();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    // Selecting the page already shown skips navigation but still closes the menu.
    await menuButton.click();
    await expect(page.getByRole('button', { name: 'Close menu' })).toBeFocused();
    await menu.getByRole('link', { name: 'Statues' }).click();
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL('/statues');
  });

  test('Escape closes the menu', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    const menu = page.getByRole('navigation', { name: 'Menu' });
    await expect(page.getByRole('button', { name: 'Close menu' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    // Focus returns to the button that opened the menu.
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
  });

  test('the open menu passes axe', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.getByRole('navigation', { name: 'Menu' })).toBeVisible();
    await expectNoAxeViolations(page);
  });
});

test.describe('color scheme', () => {
  test('follows the system and remembers an override', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    const toDark = page.getByRole('button', { name: 'Switch to dark mode' });
    await expect(toDark).toBeVisible();

    await toDark.click();
    await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();
    const scheme = () => page.evaluate(() => document.documentElement.style.colorScheme);
    expect(await scheme()).toBe('dark');

    await page.reload();
    expect(await scheme()).toBe('dark');
    await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();
  });

  test('the toggle tracks a system change until the visitor picks a scheme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible();

    await page.emulateMedia({ colorScheme: 'dark' });
    const toLight = page.getByRole('button', { name: 'Switch to light mode' });
    await expect(toLight).toBeVisible();

    await toLight.click();
    const toDark = page.getByRole('button', { name: 'Switch to dark mode' });
    await expect(toDark).toBeVisible();
    // The visitor's choice now wins over the system.
    await page.emulateMedia({ colorScheme: 'light' });
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(toDark).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.style.colorScheme)).toBe('light');
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    for (const path of ['/', '/bronzes/some-bronze']) {
      test(`${path} passes axe in ${colorScheme} mode`, async ({ page }) => {
        await page.emulateMedia({ colorScheme });
        await page.goto(path);
        await expect(page.getByRole('button', { name: /^Switch to/ })).toBeVisible();
        await expectNoAxeViolations(page);
      });
    }
  }
});
