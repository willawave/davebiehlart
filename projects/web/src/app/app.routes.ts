import { Routes } from '@angular/router';
import { eventDetailResolver } from './event/event-detail-resolver';
import { galleryDetailResolver } from './gallery/gallery-detail-resolver';
import { detailBreadcrumb } from './shared/breadcrumb/breadcrumb';
import { RouterLinks } from './shared/router-links.enum';
import { Site } from './shared/site.enum';
import { statueDetailResolver } from './statue/statue-detail-resolver';

// Each section nests its list and detail pages, so the route tree matches the breadcrumb:
// Home › Bronzes › <item>.
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home-page/home-page/home-page').then((c) => c.HomePage),
    title: Site.TITLE,
  },
  {
    path: RouterLinks.BRONZES,
    data: { breadcrumb: 'Bronzes' },
    children: [
      {
        path: '',
        loadComponent: () => import('./gallery/bronze-list/bronze-list').then((c) => c.BronzeList),
        title: `Bronzes | ${Site.TITLE}`,
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./gallery/bronze-detail/bronze-detail').then((c) => c.BronzeDetail),
        resolve: { galleryDetailResolver },
        title: `Bronzes | ${Site.TITLE}`,
        data: { breadcrumb: detailBreadcrumb },
      },
    ],
  },
  {
    path: RouterLinks.STATUES,
    data: { breadcrumb: 'Statues' },
    children: [
      {
        path: '',
        loadComponent: () => import('./statue/statue-list/statue-list').then((c) => c.StatueList),
        title: `Statues | ${Site.TITLE}`,
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./statue/statue-detail/statue-detail').then((c) => c.StatueDetail),
        resolve: { statueDetailResolver },
        title: `Statues | ${Site.TITLE}`,
        data: { breadcrumb: detailBreadcrumb },
      },
    ],
  },
  {
    path: RouterLinks.GLASS,
    data: { breadcrumb: 'Kiln Glass' },
    children: [
      {
        path: '',
        loadComponent: () => import('./gallery/glass-list/glass-list').then((c) => c.GlassList),
        title: `Kiln Glass | ${Site.TITLE}`,
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./gallery/glass-detail/glass-detail').then((c) => c.GlassDetail),
        resolve: { galleryDetailResolver },
        title: `Kiln Glass | ${Site.TITLE}`,
        data: { breadcrumb: detailBreadcrumb },
      },
    ],
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
