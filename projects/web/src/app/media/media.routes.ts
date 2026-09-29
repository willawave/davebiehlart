import { Routes } from '@angular/router';
import { detailBreadcrumb } from '../shared/breadcrumb/breadcrumb';
import { Site } from '../shared/site.enum';
import { mediaDetailResolver, mediaDetailTitle } from './media-detail-resolver';

// Loaded lazily by app.routes.ts, so the Firestore SDK the resolver pulls in stays out of the
// initial bundle.
export const mediaRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./media-list/media-list').then((c) => c.MediaList),
    title: `Media | ${Site.TITLE}`,
  },
  {
    path: ':id',
    loadComponent: () => import('./media-detail/media-detail').then((c) => c.MediaDetail),
    resolve: { mediaDetailResolver },
    title: mediaDetailTitle,
    data: { breadcrumb: detailBreadcrumb },
  },
];
