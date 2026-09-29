import { Routes } from '@angular/router';
import { detailBreadcrumb } from '../shared/breadcrumb/breadcrumb';
import { Site } from '../shared/site.enum';
import { eventDetailResolver, eventDetailTitle } from './event-detail-resolver';

// Loaded lazily by app.routes.ts, so the Firestore SDK the resolver pulls in stays out of the
// initial bundle.
export const eventRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./event-list/event-list').then((c) => c.EventList),
    title: `Events | ${Site.TITLE}`,
  },
  {
    path: ':id',
    loadComponent: () => import('./event-detail/event-detail').then((c) => c.EventDetail),
    resolve: { eventDetailResolver },
    title: eventDetailTitle,
    data: { breadcrumb: detailBreadcrumb },
  },
];
