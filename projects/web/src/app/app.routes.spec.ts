import { Route } from '@angular/router';
import { routes } from './app.routes';
import { eventDetailResolver } from './event/event-detail-resolver';
import { galleryDetailResolver } from './gallery/gallery-detail-resolver';
import { detailBreadcrumb } from './shared/breadcrumb/breadcrumb';
import { RouterLinks } from './shared/router-links.enum';
import { Site } from './shared/site.enum';
import { NotFoundPage } from './static-pages/not-found-page/not-found-page';
import { statueDetailResolver } from './statue/statue-detail-resolver';

function route(path: string): Route {
  const found = routes.find((r) => r.path === path);
  if (!found) {
    throw new Error(`No route for "${path}"`);
  }
  return found;
}

describe('routes', () => {
  const sections = [
    { path: RouterLinks.BRONZES, label: 'Bronzes', resolve: { galleryDetailResolver } },
    { path: RouterLinks.STATUES, label: 'Statues', resolve: { statueDetailResolver } },
    { path: RouterLinks.GLASS, label: 'Kiln Glass', resolve: { galleryDetailResolver } },
    { path: RouterLinks.EVENTS, label: 'Events', resolve: { eventDetailResolver } },
    { path: RouterLinks.MEDIA, label: 'Media', resolve: undefined },
  ];

  for (const { path, label, resolve } of sections) {
    describe(`/${path}`, () => {
      it(`should have the breadcrumb "${label}"`, () => {
        expect(route(path).data?.['breadcrumb']).toBe(label);
      });

      it('should title its list page', () => {
        const list = route(path).children?.find((r) => r.path === '');
        expect(list?.loadComponent).toBeDefined();
        expect(list?.title).toBe(`${label} | ${Site.TITLE}`);
      });

      it('should name its detail page after the resolved document', () => {
        const detail = route(path).children?.find((r) => r.path === ':id');
        expect(detail?.loadComponent).toBeDefined();
        expect(detail?.data?.['breadcrumb']).toBe(detailBreadcrumb);
        expect(detail?.resolve).toEqual(resolve);
      });
    });
  }

  it('should give each static page a breadcrumb', () => {
    expect(route(RouterLinks.CONTACT).data?.['breadcrumb']).toBe('Contact');
    expect(route(RouterLinks.PRIVACY_POLICY).data?.['breadcrumb']).toBe('Privacy Policy');
    expect(route(RouterLinks.TERMS_OF_USE).data?.['breadcrumb']).toBe('Terms of Use');
  });

  it('should leave the home page without a breadcrumb', () => {
    expect(route('').data).toBeUndefined();
  });

  it('should send unknown paths to the not-found page last', async () => {
    const last = routes.at(-1);
    expect(last?.path).toBe('**');
    expect(await (last?.loadComponent as () => Promise<unknown>)()).toBe(NotFoundPage);
  });

  it('should lazy-load every page', async () => {
    const loaders = routes
      .flatMap((r) => [r, ...(r.children ?? [])])
      .map((r) => r.loadComponent)
      .filter((load): load is NonNullable<Route['loadComponent']> => !!load);
    expect(loaders.length).toBe(15);
    await Promise.all(loaders.map((load) => load()));
  });
});
