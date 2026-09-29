import { inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RedirectCommand, ResolveFn, Router } from '@angular/router';
import { GalleryDocument, GalleryStyle } from 'core';
import { setPageMeta, toMetaDescription } from '../shared/page-meta';
import { Site } from '../shared/site.enum';
import { GalleryStore } from './gallery.store';

// The section heading each style is listed under.
export const GALLERY_SECTION_LABELS: Record<GalleryStyle, string> = {
  [GalleryStyle.BRONZE]: 'Bronzes',
  [GalleryStyle.GLASS]: 'Kiln Glass',
};

// The style comes from the section route's `data`.
function section(route: ActivatedRouteSnapshot): { style: GalleryStyle; label: string } {
  const style = route.data['style'] as GalleryStyle;
  return { style, label: GALLERY_SECTION_LABELS[style] };
}

function load(route: ActivatedRouteSnapshot): Promise<GalleryDocument | null> {
  return inject(GalleryStore).loadSelected(route.paramMap.get('id') ?? '', section(route).style);
}

// A missing, hidden, or wrong-section item (a glass ID under /bronzes) renders the not-found
// page, which answers 404, while the address bar keeps the requested URL.
export const galleryDetailResolver: ResolveFn<GalleryDocument> = async (route, state) => {
  const router = inject(Router);
  const meta = inject(Meta);
  // The section's list feeds the previous/next links. Loading it here puts those links in
  // the server-rendered page; if it fails, the page just renders without them.
  const [item] = await Promise.all([
    load(route),
    inject(GalleryStore)
      .ensureVisible(section(route).style)
      .catch(() => undefined),
  ]);
  if (!item) {
    // browserUrl, not skipLocationChange: on a client-side click from a list, the latter
    // would leave the list's URL in the address bar.
    return new RedirectCommand(router.parseUrl('/not-found'), { browserUrl: state.url });
  }
  const { label } = section(route);
  setPageMeta(meta, {
    title: `${item.name} | ${label}`,
    description: toMetaDescription(item.description) || `${item.name}, by Dave Biehl.`,
    path: state.url,
    image: item.imageUrls[0] ? { url: item.imageUrls[0], alt: item.name } : undefined,
  });
  return item;
};

// Every leaf route needs a title, or the previous page's title lingers. Shares the data
// resolver's request through GalleryStore.loadSelected.
export const galleryDetailTitle: ResolveFn<string> = async (route) => {
  const item = await load(route);
  const { label } = section(route);
  return item ? `${item.name} | ${label} | ${Site.TITLE}` : `Not Found | ${Site.TITLE}`;
};
