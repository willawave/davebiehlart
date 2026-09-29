import { RenderMode } from '@angular/ssr';
import { serverRoutes } from './app.routes.server';

describe('serverRoutes', () => {
  // A prerendered page would freeze the footer's copyright year (and Contact's gallery
  // hours) at build time, and the site may go years without a deploy.
  it('should prerender no routes', () => {
    expect(serverRoutes.some((route) => route.renderMode === RenderMode.Prerender)).toBe(false);
  });

  it('should server-render everything at request time via a final catch-all', () => {
    const catchAll = serverRoutes.at(-1);
    expect(catchAll?.path).toBe('**');
    expect(catchAll?.renderMode).toBe(RenderMode.Server);
    expect(serverRoutes.filter((route) => route.path === '**').length).toBe(1);
  });
});
