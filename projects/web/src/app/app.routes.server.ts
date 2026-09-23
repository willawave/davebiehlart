import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // render all static pages with the prerender mode
    // render all other pages with SSR
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
