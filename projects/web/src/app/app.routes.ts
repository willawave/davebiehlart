import { Routes } from '@angular/router';
import { eventDetailResolver } from './event/event-detail-resolver';
import { galleryDetailResolver } from './gallery/gallery-detail-resolver';
import { RouterLinks } from './shared/router-links.enum';
import { Site } from './shared/site.enum';
import { statueDetailResolver } from './statue/statue-detail-resolver';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home-page//home-page/home-page').then((c) => c.HomePage),
    title: Site.TITLE,
  },
  {
    path: RouterLinks.BRONZES,
    loadComponent: () => import('./gallery/bronze-list/bronze-list').then((c) => c.BronzeList),
    title: `Bronzes | ${Site.TITLE}`,
  },
  {
    path: `${RouterLinks.BRONZES}/:id`,
    loadComponent: () =>
      import('./gallery/bronze-detail/bronze-detail').then((c) => c.BronzeDetail),
    resolve: { galleryDetailResolver },
  },
  {
    path: RouterLinks.CONTACT,
    loadComponent: () =>
      import('./static-pages/contact-page/contact-page').then((c) => c.ContactPage),
    title: `Contact | ${Site.TITLE}`,
  },
  {
    path: RouterLinks.EVENTS,
    loadComponent: () => import('./event/event-list/event-list').then((c) => c.EventList),
    title: `Events | ${Site.TITLE}`,
  },
  {
    path: `${RouterLinks.EVENTS}/:id`,
    loadComponent: () => import('./event/event-detail/event-detail').then((c) => c.EventDetail),
    resolve: { eventDetailResolver },
  },
  {
    path: RouterLinks.GLASS,
    loadComponent: () => import('./gallery/glass-list/glass-list').then((c) => c.GlassList),
  },
  {
    path: `${RouterLinks.GLASS}/:id`,
    loadComponent: () => import('./gallery/glass-detail/glass-detail').then((c) => c.GlassDetail),
    resolve: { galleryDetailResolver },
  },
  {
    path: RouterLinks.MEDIA,
    loadComponent: () => import('./media/media-list/media-list').then((c) => c.MediaList),
    title: `Media | ${Site.TITLE}`,
  },
  {
    path: `${RouterLinks.MEDIA}/:id`,
    loadComponent: () => import('./media/media-detail/media-detail').then((c) => c.MediaDetail),
  },
  {
    path: RouterLinks.PRIVACY_POLICY,
    loadComponent: () =>
      import('./static-pages/privacy-policy-page/privacy-policy-page').then(
        (c) => c.PrivacyPolicyPage,
      ),
    title: `Privacy Policy | ${Site.TITLE}`,
  },
  {
    path: RouterLinks.STATUES,
    loadComponent: () => import('./statue/statue-list/statue-list').then((c) => c.StatueList),
    title: `Statues | ${Site.TITLE}`,
  },
  {
    path: `${RouterLinks.STATUES}/:id`,
    loadComponent: () => import('./statue/statue-detail/statue-detail').then((c) => c.StatueDetail),
    resolve: { statueDetailResolver },
  },
  {
    path: RouterLinks.TERMS_OF_USE,
    loadComponent: () =>
      import('./static-pages/terms-of-use-page/terms-of-use-page').then((c) => c.TermsOfUsePage),
    title: `Terms of Use | ${Site.TITLE}`,
  },
  {
    path: '**',
    loadComponent: () =>
      import('./static-pages/not-found-page/not-found-page').then((c) => c.NotFoundPage),
    title: `Not Found | ${Site.TITLE}`,
  },
];
