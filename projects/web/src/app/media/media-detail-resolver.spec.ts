import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import {
  ActivatedRouteSnapshot,
  RedirectCommand,
  RouterStateSnapshot,
  convertToParamMap,
} from '@angular/router';
import { MediaDocument } from 'core';
import { mediaDetailResolver, mediaDetailTitle } from './media-detail-resolver';
import { MediaStore } from './media.store';
import { articleItem, videoItem } from './media.testing';

describe('mediaDetailResolver', () => {
  const store = { loadSelected: vi.fn<(id: string) => Promise<MediaDocument | null>>() };
  let meta: Meta;

  const route = (id: string) =>
    ({ paramMap: convertToParamMap({ id }), data: {} }) as unknown as ActivatedRouteSnapshot;
  const state = { url: '/media/on-air' } as RouterStateSnapshot;

  const resolve = (id = 'on-air') =>
    TestBed.runInInjectionContext(() => mediaDetailResolver(route(id), state));
  const title = (id = 'on-air') =>
    TestBed.runInInjectionContext(() => mediaDetailTitle(route(id), state));
  const content = (selector: string) => meta.getTag(selector)?.content;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: MediaStore, useValue: store }] });
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
    ]) {
      meta.getTags(selector).forEach((tag) => meta.removeTagElement(tag));
    }
  });

  it('should load and return the item', async () => {
    const item = videoItem();
    store.loadSelected.mockResolvedValue(item);

    await expect(resolve()).resolves.toBe(item);
    expect(store.loadSelected).toHaveBeenCalledWith('on-air');
  });

  it("should describe a video's page and share its still", async () => {
    store.loadSelected.mockResolvedValue(videoItem());
    await resolve();

    expect(content("name='description'")).toBe('A visit to the foundry for the evening news.');
    expect(content("property='og:title'")).toBe('On Air at the Foundry | Media');
    expect(content("property='og:url'")).toBe('https://davebiehlart.com/media/on-air');
    expect(content("property='og:image'")).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    expect(content("property='og:image:alt'")).toBe('Still from On Air at the Foundry');
  });

  it('should fall back to a description naming the kind of item', async () => {
    store.loadSelected.mockResolvedValue(videoItem({ description: ' ' }));
    await resolve();
    expect(content("name='description'")).toBe('Video: On Air at the Foundry');

    store.loadSelected.mockResolvedValue(articleItem({ description: '' }));
    await resolve();
    expect(content("name='description'")).toBe('Article on example.com: The Sculptor Next Door');
  });

  it("should keep the site's share image for an article", async () => {
    store.loadSelected.mockResolvedValue(articleItem());
    await resolve();
    expect(content("property='og:image'")).toBeUndefined();
  });

  it.each([
    ['there is no item', null],
    ['its link cannot be shown', videoItem({ link: 'https://www.youtube.com/@davebiehl' })],
  ])('should render not found, keeping the URL, when %s', async (_, item) => {
    store.loadSelected.mockResolvedValue(item);

    const result = await resolve('hidden');

    expect(result).toBeInstanceOf(RedirectCommand);
    const redirect = result as RedirectCommand;
    expect(redirect.redirectTo.toString()).toBe('/not-found');
    expect(redirect.navigationBehaviorOptions?.browserUrl).toBe('/media/on-air');
  });

  describe('mediaDetailTitle', () => {
    it('should title the page after the item', async () => {
      store.loadSelected.mockResolvedValue(videoItem());
      await expect(title()).resolves.toBe('On Air at the Foundry | Media | Dave Biehl Art');
    });

    it('should title a missing item as not found', async () => {
      store.loadSelected.mockResolvedValue(null);
      await expect(title()).resolves.toBe('Not Found | Dave Biehl Art');
    });
  });
});
