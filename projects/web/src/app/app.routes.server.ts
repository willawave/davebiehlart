import { RenderMode, ServerRoute } from '@angular/ssr';
import { RouterLinks } from './shared/router-links.enum';

export const serverRoutes: ServerRoute[] = [
  // render all static pages with the prerender mode. Contact is not one: it shows the
  // gallery hours, which Dave can change at any time.
  { path: RouterLinks.PRIVACY_POLICY, renderMode: RenderMode.Prerender },
  { path: RouterLinks.TERMS_OF_USE, renderMode: RenderMode.Prerender },
  // render all other pages with SSR, so builds never read Firestore
  { path: '**', renderMode: RenderMode.Server },
];
