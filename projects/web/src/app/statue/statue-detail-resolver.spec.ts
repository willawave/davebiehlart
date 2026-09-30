import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import {
  ActivatedRouteSnapshot,
  RedirectCommand,
  RouterStateSnapshot,
  convertToParamMap,
} from '@angular/router';
import { StatueDocument } from 'core';
import { statueDetailResolver, statueDetailTitle } from './statue-detail-resolver';
import { StatueStore } from './statue.store';
import { statueItem } from './statue.testing';

describe('statueDetailResolver', () => {
  const store = {
    loadSelected: vi.fn<(id: string) => Promise<StatueDocument | null>>(),
    ensureVisible: vi.fn<() => Promise<void>>(() => Promise.resolve()),
  };
  let meta: Meta;

  const route = (id: string) =>
    ({ paramMap: convertToParamMap({ id }), data: {} }) as unknown as ActivatedRouteSnapshot;
  const state = { url: '/statues/pioneer' } as RouterStateSnapshot;

  const resolve = (id = 'pioneer') =>
    TestBed.runInInjectionContext(() => statueDetailResolver(route(id), state));
  const title = (id = 'pioneer') =>
    TestBed.runInInjectionContext(() => statueDetailTitle(route(id), state));
  const content = (selector: string) => meta.getTag(selector)?.content;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: StatueStore, useValue: store }] });
    meta = TestBed.inject(Meta);
  });

  // The document's <head> outlives this file; leave no share tags behind for other specs.
  afterEach(() => {
    for (const selector of [
      "name='description'",
      "property='og:title'",
      "property='og:description'",
      "property='og:url'",
      "property='og:image'",
      "property='og:image:alt'",
      "property='og:image:width'",
      "property='og:image:height'",
    ]) {
      meta.getTags(selector).forEach((tag) => meta.removeTagElement(tag));
    }
    document.head.querySelectorAll('link[rel="canonical"], #ld-page').forEach((el) => el.remove());
  });

  it('should load the statue and the list for previous/next, and return the statue', async () => {
    const item = statueItem();
    store.loadSelected.mockResolvedValue(item);

    await expect(resolve()).resolves.toBe(item);
    expect(store.loadSelected).toHaveBeenCalledWith('pioneer');
    expect(store.ensureVisible).toHaveBeenCalled();
  });

  it('should still resolve the statue when the list fails to load', async () => {
    const item = statueItem();
    store.loadSelected.mockResolvedValue(item);
    store.ensureVisible.mockRejectedValueOnce(new Error('offline'));
    await expect(resolve()).resolves.toBe(item);
  });

  it("should set the page's description and share tags from the statue", async () => {
    store.loadSelected.mockResolvedValue(statueItem());
    await resolve();

    expect(content("name='description'")).toBe(
      'The Pioneer, a bronze statue by Dave Biehl in Omaha, Nebraska: Twice life size, cast in bronze.',
    );
    expect(content("property='og:title'")).toBe('The Pioneer | Statues');
    expect(content("property='og:url'")).toBe('https://davebiehlart.com/statues/pioneer');
    expect(content("property='og:image'")).toBe('https://example.test/pioneer-1.jpg');
    expect(content("property='og:image:alt'")).toBe('The Pioneer');
  });

  it('should describe the statue and where it stands for search engines', async () => {
    const item = statueItem();
    store.loadSelected.mockResolvedValue(item);
    await resolve();

    const data = JSON.parse(document.getElementById('ld-page')?.textContent ?? '{}');
    expect(data).toMatchObject({
      '@type': 'VisualArtwork',
      name: 'The Pioneer',
      artMedium: 'Bronze',
      contentLocation: {
        '@type': 'Place',
        name: item.location.venue,
        address: { addressLocality: 'Omaha', addressRegion: 'Nebraska' },
      },
    });
  });

  it('should fall back to a description naming the place', async () => {
    store.loadSelected.mockResolvedValue(statueItem({ description: '  ' }));
    await resolve();
    expect(content("name='description'")).toBe(
      'The Pioneer, a bronze statue by Dave Biehl in Omaha, Nebraska.',
    );
  });

  it('should render not found, keeping the URL, when there is no statue', async () => {
    store.loadSelected.mockResolvedValue(null);

    const result = await resolve('hidden');

    expect(result).toBeInstanceOf(RedirectCommand);
    const redirect = result as RedirectCommand;
    expect(redirect.redirectTo.toString()).toBe('/not-found');
    expect(redirect.navigationBehaviorOptions?.browserUrl).toBe('/statues/pioneer');
  });

  describe('statueDetailTitle', () => {
    it('should title the page after the statue', async () => {
      store.loadSelected.mockResolvedValue(statueItem());
      await expect(title()).resolves.toBe('The Pioneer | Statues | Dave Biehl Art');
    });

    it('should title a missing statue as not found', async () => {
      store.loadSelected.mockResolvedValue(null);
      await expect(title()).resolves.toBe('Not Found | Dave Biehl Art');
    });
  });
});
