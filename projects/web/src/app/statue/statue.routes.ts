import { Routes } from '@angular/router';
import { detailBreadcrumb } from '../shared/breadcrumb/breadcrumb';
import { Site } from '../shared/site.enum';
import { statueDetailResolver, statueDetailTitle } from './statue-detail-resolver';

// Loaded lazily by app.routes.ts, so the Firestore SDK the resolver pulls in stays out of the
// initial bundle.
export const statueRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./statue-list/statue-list').then((c) => c.StatueList),
    title: `Statues | ${Site.TITLE}`,
  },
  {
    path: ':id',
    loadComponent: () => import('./statue-detail/statue-detail').then((c) => c.StatueDetail),
    resolve: { statueDetailResolver },
    title: statueDetailTitle,
    data: { breadcrumb: detailBreadcrumb },
  },
];
