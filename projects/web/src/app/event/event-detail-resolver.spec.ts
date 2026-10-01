import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import {
  ActivatedRouteSnapshot,
  RedirectCommand,
  RouterStateSnapshot,
  convertToParamMap,
} from '@angular/router';
import { EventDocument } from 'core';
import { eventDetailResolver, eventDetailTitle } from './event-detail-resolver';
import { EventStore } from './event.store';
import { eventItem } from './event.testing';

describe('eventDetailResolver', () => {
  const store = { loadSelected: vi.fn<(id: string) => Promise<EventDocument | null>>() };
  let meta: Meta;

  const route = (id: string) =>
    ({ paramMap: convertToParamMap({ id }), data: {} }) as unknown as ActivatedRouteSnapshot;
  const state = { url: '/events/open-studio' } as RouterStateSnapshot;

  const resolve = (id = 'open-studio') =>
    TestBed.runInInjectionContext(() => eventDetailResolver(route(id), state));
  const title = (id = 'open-studio') =>
    TestBed.runInInjectionContext(() => eventDetailTitle(route(id), state));
  const content = (selector: string) => meta.getTag(selector)?.content;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: EventStore, useValue: store }] });
    meta = TestBed.inject(Meta);
  });

  // The document's <head> outlives this file; leave no share tags behind for other specs.
  afterEach(() => {
    for (const selector of [
      "name='description'",
      "property='og:title'",
      "property='og:description'",
      "property='og:url'",
    ]) {
      meta.getTags(selector).forEach((tag) => meta.removeTagElement(tag));
    }
    document.head.querySelectorAll('link[rel="canonical"], #ld-page').forEach((el) => el.remove());
  });

  it('should load and return the event', async () => {
    const item = eventItem();
    store.loadSelected.mockResolvedValue(item);

    await expect(resolve()).resolves.toBe(item);
    expect(store.loadSelected).toHaveBeenCalledWith('open-studio');
  });

  it("should set the page's description and share tags from the event", async () => {
    store.loadSelected.mockResolvedValue(eventItem());
    await resolve();

    expect(content("name='description'")).toBe('Meet the artist and see new work in progress.');
    expect(content("property='og:title'")).toBe('Open Studio | Events');
    expect(content("property='og:url'")).toBe('https://davebiehlart.com/events/open-studio');
  });

  it('should describe the event, its date and its venue for search engines', async () => {
    const item = eventItem();
    store.loadSelected.mockResolvedValue(item);
    await resolve();

    const data = JSON.parse(document.getElementById('ld-page')?.textContent ?? '{}');
    expect(data).toMatchObject({
      '@type': 'Event',
      name: 'Open Studio',
      url: 'https://davebiehlart.com/events/open-studio',
      startDate: item.date.toDate().toISOString().slice(0, 10),
      location: {
        name: 'Main Street Studios & Art Gallery',
        address: { addressLocality: 'Elkhorn' },
      },
    });
  });

  it('should fall back to a description naming the place', async () => {
    store.loadSelected.mockResolvedValue(eventItem({ description: '  ' }));
    await resolve();
    expect(content("name='description'")).toBe(
      'Open Studio at Main Street Studios & Art Gallery, Elkhorn, Nebraska.',
    );
  });

  it('should render not found, keeping the URL, when there is no event', async () => {
    store.loadSelected.mockResolvedValue(null);

    const result = await resolve('hidden');

    expect(result).toBeInstanceOf(RedirectCommand);
    const redirect = result as RedirectCommand;
    expect(redirect.redirectTo.toString()).toBe('/not-found');
    expect(redirect.navigationBehaviorOptions?.browserUrl).toBe('/events/open-studio');
  });

  describe('eventDetailTitle', () => {
    it('should title the page after the event', async () => {
      store.loadSelected.mockResolvedValue(eventItem());
      await expect(title()).resolves.toBe('Open Studio | Events | Dave Biehl Art');
    });

    it('should title a missing event as not found', async () => {
      store.loadSelected.mockResolvedValue(null);
      await expect(title()).resolves.toBe('Not Found | Dave Biehl Art');
    });
  });
});
