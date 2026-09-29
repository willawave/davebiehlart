import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Server-render every page per request, so builds never read Firestore and time-based
  // content (the footer's copyright year, Contact's gallery hours) never goes stale.
  // Don't prerender: a prerendered page freezes its footer year at build time.
  { path: '**', renderMode: RenderMode.Server },
];
