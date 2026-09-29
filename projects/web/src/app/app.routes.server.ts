import { RenderMode, ServerRoute } from '@angular/ssr';
import { RouterLinks } from './shared/router-links.enum';

export const serverRoutes: ServerRoute[] = [
  // Prerender the static pages that never read Firestore. Contact stays on SSR because it
  // shows the live gallery hours, and Not Found because its 404 status is set per request.
  { path: RouterLinks.PRIVACY_POLICY, renderMode: RenderMode.Prerender },
  { path: RouterLinks.TERMS_OF_USE, renderMode: RenderMode.Prerender },
  // render all other pages with SSR, so builds never read Firestore
  { path: '**', renderMode: RenderMode.Server },
];
