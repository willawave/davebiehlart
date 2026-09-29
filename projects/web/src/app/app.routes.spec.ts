import { Route, Routes } from '@angular/router';
import { GalleryStyle } from 'core';
import { routes } from './app.routes';
import { eventDetailResolver } from './event/event-detail-resolver';
import { galleryDetailResolver, galleryDetailTitle } from './gallery/gallery-detail-resolver';
import { detailBreadcrumb } from './shared/breadcrumb/breadcrumb';
import { RouterLinks } from './shared/router-links.enum';
import { Site } from './shared/site.enum';
import { NotFoundPage } from './static-pages/not-found-page/not-found-page';
import { statueDetailResolver, statueDetailTitle } from './statue/statue-detail-resolver';

function route(path: string): Route {
  const found = routes.find((r) => r.path === path);
  if (!found) {
    throw new Error(`No route for "${path}"`);
  }
  return found;
}

// A route's children, whether inline or lazily loaded (none for a leaf page).
async function childrenOf(section: Route): Promise<Routes> {
  if (section.loadChildren) {
    return (section.loadChildren as () => Promise<Routes>)();
  }
  return section.children ?? [];
}

describe('routes', () => {
  const sections = [
    {
      path: RouterLinks.BRONZES,
      label: 'Bronzes',
      resolve: { galleryDetailResolver },
      title: galleryDetailTitle,
      style: GalleryStyle.BRONZE,
    },
    {
      path: RouterLinks.STATUES,
      label: 'Statues',
      resolve: { statueDetailResolver },
      title: statueDetailTitle,
    },
    {
      path: RouterLinks.GLASS,
      label: 'Kiln Glass',
      resolve: { galleryDetailResolver },
      title: galleryDetailTitle,
      style: GalleryStyle.GLASS,
    },
    {
      path: RouterLinks.EVENTS,
      label: 'Events',
      resolve: { eventDetailResolver },
      title: `Events | ${Site.TITLE}`,
    },
    { path: RouterLinks.MEDIA, label: 'Media', resolve: undefined, title: `Media | ${Site.TITLE}` },
  ];

  for (const { path, label, resolve, title, style } of sections) {
    describe(`/${path}`, () => {
      it(`should have the breadcrumb "${label}"`, () => {
        expect(route(path).data?.['breadcrumb']).toBe(label);
        expect(route(path).data?.['style']).toBe(style);
      });

      it('should title its list page', async () => {
        const list = (await childrenOf(route(path))).find((r) => r.path === '');
        expect(list?.loadComponent).toBeDefined();
        expect(list?.title).toBe(`${label} | ${Site.TITLE}`);
      });

      it('should name its detail page after the resolved document', async () => {
        const detail = (await childrenOf(route(path))).find((r) => r.path === ':id');
        expect(detail?.loadComponent).toBeDefined();
        expect(detail?.data?.['breadcrumb']).toBe(detailBreadcrumb);
        expect(detail?.resolve).toEqual(resolve);
        expect(detail?.title).toBe(title);
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
    const children = await Promise.all(routes.map(childrenOf));
    const loaders = [...routes, ...children.flat()]
      .map((r) => r.loadComponent)
      .filter((load): load is NonNullable<Route['loadComponent']> => !!load);
    expect(loaders.length).toBe(15);
    await Promise.all(loaders.map((load) => load()));
  });
});
