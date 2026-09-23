import { Routes } from '@angular/router';
import { authGuard } from './auth/auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./auth/sign-in-page/sign-in-page').then((c) => c.SignInPage),
    title: 'Sign In',
  },
  {
    path: 'access-denied',
    loadComponent: () =>
      import('./auth/access-denied-page/access-denied-page').then((c) => c.AccessDeniedPage),
    title: 'Access Denied',
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./auth/dashboard-page/dashboard-page').then((c) => c.DashboardPage),
    title: 'Dashboard',
  },
  {
    path: 'events',
    canActivate: [authGuard],
    loadComponent: () => import('./event/event-table/event-table').then((c) => c.EventTable),
    title: 'Events',
  },
  {
    path: 'events-add',
    canActivate: [authGuard],
    loadComponent: () => import('./event/event-add/event-add').then((c) => c.EventAdd),
    title: 'Add Event',
  },
  {
    path: 'events-edit/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./event/event-edit/event-edit').then((c) => c.EventEdit),
    title: 'Edit Event',
  },
  {
    path: 'gallery',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./gallery/gallery-table/gallery-table').then((c) => c.GalleryTable),
    title: 'Gallery',
  },
  {
    path: 'gallery-add',
    canActivate: [authGuard],
    loadComponent: () => import('./gallery/gallery-add/gallery-add').then((c) => c.GalleryAdd),
    title: 'Add Gallery',
  },
  {
    path: 'gallery-edit/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./gallery/gallery-edit/gallery-edit').then((c) => c.GalleryEdit),
    title: 'Edit Gallery',
  },
  {
    path: 'media',
    canActivate: [authGuard],
    loadComponent: () => import('./media/media-table/media-table').then((c) => c.MediaTable),
    title: 'Media',
  },
  {
    path: 'media-add',
    canActivate: [authGuard],
    loadComponent: () => import('./media/media-add/media-add').then((c) => c.MediaAdd),
    title: 'Add Media',
  },
  {
    path: 'media-edit/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./media/media-edit/media-edit').then((c) => c.MediaEdit),
    title: 'Edit Media',
  },
  {
    path: 'statues',
    canActivate: [authGuard],
    loadComponent: () => import('./statue/statue-table/statue-table').then((c) => c.StatueTable),
    title: 'Statues',
  },
  {
    path: 'statues-add',
    canActivate: [authGuard],
    loadComponent: () => import('./statue/statue-add/statue-add').then((c) => c.StatueAdd),
    title: 'Add Statue',
  },
  {
    path: 'statues-edit/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./statue/statue-edit/statue-edit').then((c) => c.StatueEdit),
    title: 'Edit Statue',
  },
];
