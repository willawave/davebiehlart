import { inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RedirectCommand, ResolveFn, Router } from '@angular/router';
import { EventDocument } from 'core';
import { setPageMeta, toMetaDescription } from '../shared/page-meta';
import { Site } from '../shared/site.enum';
import { eventData } from '../shared/structured-data';
import { EventStore } from './event.store';

function load(route: ActivatedRouteSnapshot): Promise<EventDocument | null> {
  return inject(EventStore).loadSelected(route.paramMap.get('id') ?? '');
}

// A missing or hidden event renders the not-found page, which answers 404, while the
// address bar keeps the requested URL. A past event still renders; its page says it ended.
export const eventDetailResolver: ResolveFn<EventDocument> = async (route, state) => {
  const router = inject(Router);
  const meta = inject(Meta);
  const item = await load(route);
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
  const description =
    toMetaDescription(item.description) || `${item.name} at ${venue}, ${city}, ${region}.`;
  setPageMeta(meta, {
    title: `${item.name} | Events`,
    description,
    path: state.url,
    structuredData: eventData({
      name: item.name,
      description,
      path: state.url,
      startDate: item.date.toDate().toISOString().slice(0, 10),
      place: { venue, street, city, region },
    }),
  });
  return item;
};

// Every leaf route needs a title, or the previous page's title lingers. Shares the data
// resolver's request through EventStore.loadSelected.
export const eventDetailTitle: ResolveFn<string> = async (route) => {
  const item = await load(route);
  return item ? `${item.name} | Events | ${Site.TITLE}` : `Not Found | ${Site.TITLE}`;
};
