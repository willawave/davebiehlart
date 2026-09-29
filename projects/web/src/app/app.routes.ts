import { Routes } from '@angular/router';
import { GalleryStyle } from 'core';
import { eventDetailResolver } from './event/event-detail-resolver';
import { detailBreadcrumb } from './shared/breadcrumb/breadcrumb';
import { RouterLinks } from './shared/router-links.enum';
import { Site } from './shared/site.enum';

// Each section nests its list and detail pages, so the route tree matches the breadcrumb:
// Home › Bronzes › <item>. Sections that read Firestore load their children lazily
// (e.g. gallery/gallery.routes.ts), keeping the SDK out of the initial bundle.
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home-page/home-page/home-page').then((c) => c.HomePage),
    title: Site.TITLE,
  },
  {
    path: RouterLinks.BRONZES,
    data: { breadcrumb: 'Bronzes', style: GalleryStyle.BRONZE },
    loadChildren: () => import('./gallery/gallery.routes').then((m) => m.bronzeRoutes),
  },
  {
    path: RouterLinks.STATUES,
    data: { breadcrumb: 'Statues' },
    loadChildren: () => import('./statue/statue.routes').then((m) => m.statueRoutes),
  },
  {
    path: RouterLinks.GLASS,
    data: { breadcrumb: 'Kiln Glass', style: GalleryStyle.GLASS },
    loadChildren: () => import('./gallery/gallery.routes').then((m) => m.glassRoutes),
  },
  {
    path: RouterLinks.EVENTS,
    data: { breadcrumb: 'Events' },
    children: [
      {
        path: '',
        loadComponent: () => import('./event/event-list/event-list').then((c) => c.EventList),
        title: `Events | ${Site.TITLE}`,
      },
      {
        path: ':id',
        loadComponent: () => import('./event/event-detail/event-detail').then((c) => c.EventDetail),
        resolve: { eventDetailResolver },
        title: `Events | ${Site.TITLE}`,
        data: { breadcrumb: detailBreadcrumb },
      },
    ],
  },
  {
    path: RouterLinks.MEDIA,
    data: { breadcrumb: 'Media' },
    children: [
      {
        path: '',
        loadComponent: () => import('./media/media-list/media-list').then((c) => c.MediaList),
        title: `Media | ${Site.TITLE}`,
      },
      {
        path: ':id',
        loadComponent: () => import('./media/media-detail/media-detail').then((c) => c.MediaDetail),
        title: `Media | ${Site.TITLE}`,
        data: { breadcrumb: detailBreadcrumb },
      },
    ],
  },
  {
    path: RouterLinks.CONTACT,
    loadComponent: () =>
      import('./static-pages/contact-page/contact-page').then((c) => c.ContactPage),
    title: `Contact | ${Site.TITLE}`,
    data: { breadcrumb: 'Contact' },
  },
  {
    path: RouterLinks.PRIVACY_POLICY,
    loadComponent: () =>
      import('./static-pages/privacy-policy-page/privacy-policy-page').then(
        (c) => c.PrivacyPolicyPage,
      ),
    title: `Privacy Policy | ${Site.TITLE}`,
    data: { breadcrumb: 'Privacy Policy' },
  },
  {
    path: RouterLinks.TERMS_OF_USE,
    loadComponent: () =>
      import('./static-pages/terms-of-use-page/terms-of-use-page').then((c) => c.TermsOfUsePage),
    title: `Terms of Use | ${Site.TITLE}`,
    data: { breadcrumb: 'Terms of Use' },
  },
  {
    path: '**',
    loadComponent: () =>
      import('./static-pages/not-found-page/not-found-page').then((c) => c.NotFoundPage),
    title: `Not Found | ${Site.TITLE}`,
  },
];
