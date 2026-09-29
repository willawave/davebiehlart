import AxeBuilder from '@axe-core/playwright';
import { Page, expect } from '@playwright/test';

// Both accounts are Google users in the Auth emulator seeded from emulator-data/, and only
// admin@test.com has a users/{uid} document.
export const ADMIN = 'admin@test.com';
export const OUTSIDER = 'outsider@test.com';

// signInWithPopup against the Auth emulator opens its fake Google account chooser, which
// lists the seeded accounts by email. The chooser hands the result back through a relay
// iframe the SDK adds to this page; if that frame hasn't loaded when an account is picked,
// the chooser finds no frame to post to and never closes. A person is never that fast, so
// wait for both pages to finish loading before clicking.
export async function signInWithGoogle(page: Page, email: string): Promise<void> {
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Sign in with Google' }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState('load');
  const relayFrame = () =>
    page.frames().find((frame) => frame.url().includes('/emulator/auth/iframe'));
  await expect.poll(relayFrame).toBeDefined();
  const relay = relayFrame();
  if (!relay) throw new Error('Auth emulator relay iframe disappeared before it loaded');
  await relay.waitForLoadState('load');
  const closed = popup.waitForEvent('close', { timeout: 10_000 });
  await popup.getByText(email).click();
  await closed.catch(async (error: unknown) => {
    const shown = await popup
      .locator('body')
      .innerText()
      .catch(() => '(closed)');
    throw new Error(`Account chooser did not close; it shows: ${shown}`, { cause: error });
  });
}

// WCAG 2.1 A/AA. The SDK's hidden relay iframe belongs to the Auth emulator, not the app.
// Waits for finite animations first: a form field's hint fades in as its error clears, and
// axe would measure its contrast mid-fade.
export async function expectNoAxeViolations(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('iframe[aria-hidden="true"]')
    .analyze();
  expect(results.violations).toEqual([]);
}
