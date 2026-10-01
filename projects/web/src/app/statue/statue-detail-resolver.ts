import { inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RedirectCommand, ResolveFn, Router } from '@angular/router';
import { StatueDocument } from 'core';
import { describeWork, setPageMeta } from '../shared/page-meta';
import { Site } from '../shared/site.enum';
import { artworkData } from '../shared/structured-data';
import { StatueStore } from './statue.store';

function load(route: ActivatedRouteSnapshot): Promise<StatueDocument | null> {
  return inject(StatueStore).loadSelected(route.paramMap.get('id') ?? '');
}

// A missing or hidden statue renders the not-found page, which answers 404, while the
// address bar keeps the requested URL.
export const statueDetailResolver: ResolveFn<StatueDocument> = async (route, state) => {
  const router = inject(Router);
  const meta = inject(Meta);
  // The list feeds the previous/next links. Loading it here puts those links in the
  // server-rendered page; if it fails, the page just renders without them.
  const [item] = await Promise.all([
    load(route),
    inject(StatueStore)
      .ensureVisible()
      .catch(() => undefined),
  ]);
  if (!item) {
    // browserUrl, not skipLocationChange: on a client-side click from the list, the latter
    // would leave the list's URL in the address bar.
    return new RedirectCommand(router.parseUrl('/not-found'), { browserUrl: state.url });
  }
  // Trimmed: stored locations can carry stray spaces ("Grand Island ").
  const [venue, street, city, region] = [
    item.location.venue,
    item.location.street,
    item.location.city,
    item.location.state,
  ].map((part) => part.trim());
  const description = describeWork(
    `${item.name}, a bronze statue by Dave Biehl in ${city}, ${region}`,
    item.description,
  );
  setPageMeta(meta, {
    title: `${item.name} | Statues`,
    description,
    path: state.url,
    image: item.imageUrls[0] ? { url: item.imageUrls[0], alt: item.name } : undefined,
    structuredData: artworkData({
      name: item.name,
      description,
      path: state.url,
      images: item.imageUrls,
      medium: 'Bronze',
      artform: 'Sculpture',
      place: { venue, street, city, region },
    }),
  });
  return item;
};

// Every leaf route needs a title, or the previous page's title lingers. Shares the data
// resolver's request through StatueStore.loadSelected.
export const statueDetailTitle: ResolveFn<string> = async (route) => {
  const item = await load(route);
  return item ? `${item.name} | Statues | ${Site.TITLE}` : `Not Found | ${Site.TITLE}`;
};
