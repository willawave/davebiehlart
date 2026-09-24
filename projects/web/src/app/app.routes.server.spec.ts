import { RenderMode } from '@angular/ssr';
import { serverRoutes } from './app.routes.server';
import { RouterLinks } from './shared/router-links.enum';

describe('serverRoutes', () => {
  it('should prerender only the static pages, which never read Firestore', () => {
    const prerendered = serverRoutes
      .filter((route) => route.renderMode === RenderMode.Prerender)
      .map((route) => route.path)
      .sort();
    expect(prerendered).toEqual(
      [RouterLinks.CONTACT, RouterLinks.PRIVACY_POLICY, RouterLinks.TERMS_OF_USE].sort(),
    );
  });

  it('should server-render everything else at request time via a final catch-all', () => {
    const catchAll = serverRoutes.at(-1);
    expect(catchAll?.path).toBe('**');
    expect(catchAll?.renderMode).toBe(RenderMode.Server);
    expect(serverRoutes.filter((route) => route.path === '**').length).toBe(1);
  });
});
