import { Routes } from '@angular/router';
import { detailBreadcrumb } from '../shared/breadcrumb/breadcrumb';
import { Site } from '../shared/site.enum';
import { galleryDetailResolver, galleryDetailTitle } from './gallery-detail-resolver';

// Loaded lazily by app.routes.ts, so the Firestore SDK the resolver pulls in stays out of the
// initial bundle. The section route there sets `data.style`, which these routes inherit.

export const bronzeRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./bronze-list/bronze-list').then((c) => c.BronzeList),
    title: `Bronzes | ${Site.TITLE}`,
  },
  {
    path: ':id',
    loadComponent: () => import('./bronze-detail/bronze-detail').then((c) => c.BronzeDetail),
    resolve: { galleryDetailResolver },
    title: galleryDetailTitle,
    data: { breadcrumb: detailBreadcrumb },
  },
];

export const glassRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./glass-list/glass-list').then((c) => c.GlassList),
    title: `Kiln Glass | ${Site.TITLE}`,
  },
  {
    path: ':id',
    loadComponent: () => import('./glass-detail/glass-detail').then((c) => c.GlassDetail),
    resolve: { galleryDetailResolver },
    title: galleryDetailTitle,
    data: { breadcrumb: detailBreadcrumb },
  },
];
