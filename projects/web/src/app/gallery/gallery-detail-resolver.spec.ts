import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import {
  ActivatedRouteSnapshot,
  RedirectCommand,
  RouterStateSnapshot,
  convertToParamMap,
} from '@angular/router';
import { GalleryDocument, GalleryStyle } from 'core';
import { galleryDetailResolver, galleryDetailTitle } from './gallery-detail-resolver';
import { GalleryStore } from './gallery.store';
import { galleryItem } from './gallery.testing';

describe('galleryDetailResolver', () => {
  const store = {
    loadSelected: vi.fn<(id: string, style: GalleryStyle) => Promise<GalleryDocument | null>>(),
    ensureVisible: vi.fn<(style: GalleryStyle) => Promise<void>>(() => Promise.resolve()),
  };
  let meta: Meta;

  function route(id: string, style: GalleryStyle): ActivatedRouteSnapshot {
    return {
      paramMap: convertToParamMap({ id }),
      data: { style },
    } as unknown as ActivatedRouteSnapshot;
  }
  const state = { url: '/bronzes/mustang' } as RouterStateSnapshot;

  function resolve(id = 'mustang', style = GalleryStyle.BRONZE) {
    return TestBed.runInInjectionContext(() => galleryDetailResolver(route(id, style), state));
  }
  function title(id = 'mustang', style = GalleryStyle.BRONZE) {
    return TestBed.runInInjectionContext(() => galleryDetailTitle(route(id, style), state));
  }
  const content = (selector: string) => meta.getTag(selector)?.content;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: GalleryStore, useValue: store }] });
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

  it('should load the item for the section style and return it', async () => {
    const item = galleryItem();
    store.loadSelected.mockResolvedValue(item);

    await expect(resolve()).resolves.toBe(item);
    expect(store.loadSelected).toHaveBeenCalledWith('mustang', GalleryStyle.BRONZE);
  });

  it("should load the section's list for the previous/next links", async () => {
    store.loadSelected.mockResolvedValue(galleryItem({ style: GalleryStyle.GLASS }));
    await resolve('bowl', GalleryStyle.GLASS);
    expect(store.ensureVisible).toHaveBeenCalledWith(GalleryStyle.GLASS);
  });

  it('should still resolve the item when the list fails to load', async () => {
    const item = galleryItem();
    store.loadSelected.mockResolvedValue(item);
    store.ensureVisible.mockRejectedValueOnce(new Error('offline'));
    await expect(resolve()).resolves.toBe(item);
  });

  it("should set the page's description and share tags from the item", async () => {
    store.loadSelected.mockResolvedValue(galleryItem());
    await resolve();

    expect(content("name='description'")).toBe(
      'Mustang at Dawn, a bronze by Dave Biehl: Cast bronze on a walnut base.',
    );
    expect(content("property='og:title'")).toBe('Mustang at Dawn | Bronzes');
    expect(content("property='og:url'")).toBe('https://davebiehlart.com/bronzes/mustang');
    expect(content("property='og:image'")).toBe('https://example.test/mustang-1.jpg');
    expect(content("property='og:image:alt'")).toBe('Mustang at Dawn');
  });

  it('should describe the page as a bronze artwork by Dave Biehl for search engines', async () => {
    store.loadSelected.mockResolvedValue(galleryItem());
    await resolve();

    const data = JSON.parse(document.getElementById('ld-page')?.textContent ?? '{}');
    expect(data).toMatchObject({
      '@type': 'VisualArtwork',
      name: 'Mustang at Dawn',
      url: 'https://davebiehlart.com/bronzes/mustang',
      artMedium: 'Bronze',
      creator: { '@type': 'Person', name: 'Dave Biehl' },
    });
    expect(data.image[0]).toBe('https://example.test/mustang-1.jpg');
  });

  it('should call a glass item kiln glass', async () => {
    store.loadSelected.mockResolvedValue(galleryItem({ style: GalleryStyle.GLASS }));
    await resolve('bowl', GalleryStyle.GLASS);
    expect(content("name='description'")).toMatch(/^Mustang at Dawn, kiln glass by Dave Biehl: /);
  });

  it('should fall back to a generated description', async () => {
    store.loadSelected.mockResolvedValue(galleryItem({ description: '  ' }));
    await resolve();
    expect(content("name='description'")).toBe('Mustang at Dawn, a bronze by Dave Biehl.');
  });

  it('should render not found, keeping the URL, when there is no item', async () => {
    store.loadSelected.mockResolvedValue(null);

    const result = await resolve('hidden', GalleryStyle.GLASS);

    expect(result).toBeInstanceOf(RedirectCommand);
    const redirect = result as RedirectCommand;
    expect(redirect.redirectTo.toString()).toBe('/not-found');
    expect(redirect.navigationBehaviorOptions?.browserUrl).toBe('/bronzes/mustang');
    expect(redirect.navigationBehaviorOptions?.skipLocationChange).toBeUndefined();
    expect(store.loadSelected).toHaveBeenCalledWith('hidden', GalleryStyle.GLASS);
  });

  describe('galleryDetailTitle', () => {
    it('should title the page after the item and its section', async () => {
      store.loadSelected.mockResolvedValue(galleryItem({ style: GalleryStyle.GLASS }));
      await expect(title('bowl', GalleryStyle.GLASS)).resolves.toBe(
        'Mustang at Dawn | Kiln Glass | Dave Biehl Art',
      );
    });

    it('should title a missing item as not found', async () => {
      store.loadSelected.mockResolvedValue(null);
      await expect(title()).resolves.toBe('Not Found | Dave Biehl Art');
    });
  });
});
