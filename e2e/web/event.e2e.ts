import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';

// The emulator seed holds past events only (seed-event-01 "Fall Open Studio" is the most
// recent) plus a hidden one, as production usually has nothing coming up. The upcoming
// event these tests need is written straight to the Firestore emulator, dated relative to
// today so it never goes stale, and deleted afterwards.
const EVENTS =
  'http://127.0.0.1:8080/v1/projects/demo-bronze-horse/databases/(default)/documents/event';
const UPCOMING_ID = 'e2e-upcoming-event';
const DAY = 24 * 60 * 60 * 1000;

// The empty state must be checked before the upcoming event exists.
test.describe.configure({ mode: 'serial' });

// WCAG 2.1 A/AA.
async function expectNoAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
}

// The emulator's owner token skips the security rules.
async function writeEvent(id: string, fields: Record<string, unknown> | null): Promise<void> {
  const response = await fetch(`${EVENTS}/${id}`, {
    method: fields ? 'PATCH' : 'DELETE',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: fields ? JSON.stringify({ fields }) : undefined,
  });
  expect(response.ok).toBe(true);
}

// Midnight in Nebraska, 30 days out: what the admin's datepicker saves.
const upcomingDate = new Date(Date.now() + 30 * DAY);
upcomingDate.setUTCHours(5, 0, 0, 0);
const upcomingLongDate = upcomingDate.toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

test.beforeEach(async ({ page }) => {
  // No OpenStreetMap tiles: tests stay offline-safe.
  await page.route(/tile\.openstreetmap\.org/, (route) => route.abort());
});

test.afterAll(async () => {
  await writeEvent(UPCOMING_ID, null);
});

test('with nothing coming up, the list says so and points to the contact page', async ({
  page,
  request,
}) => {
  const response = await request.get('/events');
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain('No upcoming events right now.');

  await page.goto('/events');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Events');
  await expect(page.getByText('No upcoming events right now.')).toBeVisible();
  await expect(page.locator('main')).not.toContainText('Fall Open Studio');
  await expect(page.getByRole('link', { name: 'get in touch' })).toHaveAttribute(
    'href',
    '/contact',
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'Upcoming shows, open studios and dedications with artist Dave Biehl.',
  );
  await expectNoAxeViolations(page);
});

test('a past event still opens, saying it has ended, with its address and map', async ({
  page,
  request,
}) => {
  const response = await request.get('/events/seed-event-01');
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('<title>Fall Open Studio | Events | Dave Biehl Art</title>');
  expect(html).toContain('This event has ended.');

  await page.goto('/events/seed-event-01');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fall Open Studio');
  await expect(page.locator('.kicker')).toHaveText(
    'Event · Saturday, September 12, 2026 · 6:30 PM',
  );
  await expect(page.getByText('This event has ended.')).toBeVisible();
  await expect(page.locator('address')).toContainText('Main Street Studios & Art Gallery');
  const map = page.getByRole('region', { name: 'Map showing where Fall Open Studio takes place' });
  await expect(map.locator('.ol-viewport')).toBeVisible();
  await expectNoAxeViolations(page);

  await page.getByRole('link', { name: 'See upcoming events' }).click();
  await expect(page).toHaveURL('/events');
});

test('an upcoming event is listed and opens with its time, link and map', async ({
  page,
  request,
}) => {
  await writeEvent(UPCOMING_ID, {
    date: { timestampValue: upcomingDate.toISOString() },
    time: { stringValue: '19:00' },
    name: { stringValue: 'E2E Gallery Opening' },
    description: { stringValue: 'New bronzes and kiln glass, shown for the first time.' },
    link: { stringValue: 'https://example.com/e2e-gallery-opening' },
    visible: { booleanValue: true },
    location: {
      mapValue: {
        fields: {
          venue: { stringValue: 'Old Market Gallery' },
          street: { stringValue: '1100 Howard Street' },
          city: { stringValue: 'Omaha' },
          state: { stringValue: 'Nebraska' },
          latitude: { doubleValue: 41.2555 },
          longitude: { doubleValue: -95.9318 },
        },
      },
    },
  });

  // Server-rendered, so crawlers see the list.
  const html = await (await request.get('/events')).text();
  expect(html).toContain('E2E Gallery Opening');
  expect(html).not.toContain('No upcoming events right now.');

  await page.goto('/events');
  const rows = page.locator('main a.event');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('E2E Gallery Opening');
  await expect(rows.first()).toContainText(`${upcomingLongDate} · 7:00 PM`);
  await expect(rows.first()).toContainText('Old Market Gallery · Omaha, Nebraska');
  await expectNoAxeViolations(page);

  await rows.first().click();
  await expect(page).toHaveURL(`/events/${UPCOMING_ID}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('E2E Gallery Opening');
  await expect(page.locator('.kicker')).toHaveText(`Event · ${upcomingLongDate} · 7:00 PM`);
  await expect(page.getByText('This event has ended.')).toHaveCount(0);
  const link = page.getByRole('link', { name: /Event details/ });
  await expect(link).toHaveAttribute('href', 'https://example.com/e2e-gallery-opening');
  await expect(link).toHaveAttribute('target', '_blank');
  const map = page.getByRole('region', {
    name: 'Map showing where E2E Gallery Opening takes place',
  });
  await expect(map.locator('.ol-viewport')).toBeVisible();
  await expect(page).toHaveTitle('E2E Gallery Opening | Events | Dave Biehl Art');
  await expectNoAxeViolations(page);
});

for (const path of ['/events/seed-event-hidden', '/events/seed-statue-01']) {
  test(`${path} is not found`, async ({ request, page }) => {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain('Draft Studio Tour');

    await page.goto(path);
    await expect(page).toHaveURL(path);
    await expect(page).toHaveTitle(/^Not Found/);
  });
}
