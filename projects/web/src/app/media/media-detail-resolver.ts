import { inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RedirectCommand, ResolveFn, Router } from '@angular/router';
import { MediaDocument, parseMediaLink, youTubeThumbnailUrl } from 'core';
import { setPageMeta, toMetaDescription } from '../shared/page-meta';
import { Site } from '../shared/site.enum';
import { MediaStore } from './media.store';

function load(route: ActivatedRouteSnapshot): Promise<MediaDocument | null> {
  return inject(MediaStore).loadSelected(route.paramMap.get('id') ?? '');
}

// A missing, hidden or unshowable item renders the not-found page, which answers 404, while
// the address bar keeps the requested URL.
export const mediaDetailResolver: ResolveFn<MediaDocument> = async (route, state) => {
  const router = inject(Router);
  const meta = inject(Meta);
  const item = await load(route);
  const link = item && parseMediaLink(item.link);
  if (!item || !link) {
    // browserUrl, not skipLocationChange: on a client-side click from the list, the latter
    // would leave the list's URL in the address bar.
    return new RedirectCommand(router.parseUrl('/not-found'), { browserUrl: state.url });
  }
  const fallback =
    link.kind === 'video' ? `Video: ${item.title}` : `Article on ${link.site}: ${item.title}`;
  setPageMeta(meta, {
    title: `${item.title} | Media`,
    description: toMetaDescription(item.description) || fallback,
    path: state.url,
    // A video shares its own still; an article keeps the site's default image.
    image:
      link.kind === 'video'
        ? { url: youTubeThumbnailUrl(link.videoId), alt: `Still from ${item.title}` }
        : undefined,
  });
  return item;
};

// Every leaf route needs a title, or the previous page's title lingers. Shares the data
// resolver's request through MediaStore.loadSelected.
export const mediaDetailTitle: ResolveFn<string> = async (route) => {
  const item = await load(route);
  return item && parseMediaLink(item.link)
    ? `${item.title} | Media | ${Site.TITLE}`
    : `Not Found | ${Site.TITLE}`;
};
