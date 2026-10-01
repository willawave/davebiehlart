import { DOCUMENT } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, Data, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { breadcrumbData, setStructuredData } from '../structured-data';

export interface BreadcrumbItem {
  label: string;
  url: string;
}

// Set as `data: { breadcrumb }` on a route. A function builds the label from the route's
// resolved data, e.g. a detail page named after its document.
export type BreadcrumbLabel = string | ((data: Data) => string);

// Label for detail routes: the resolved document's `name` (statues, gallery, events) or
// `title` (media), or "Details" until the route resolves one.
export const detailBreadcrumb: BreadcrumbLabel = (data) => {
  for (const value of Object.values(data)) {
    if (value && typeof value === 'object') {
      const doc = value as { name?: unknown; title?: unknown };
      const label = (typeof doc.name === 'string' && doc.name) || doc.title;
      if (typeof label === 'string' && label) {
        return label;
      }
    }
  }
  return 'Details';
};

// Walks the activated route tree from the root and returns one crumb per route that sets its
// own `data.breadcrumb`, prefixed with Home. Empty on routes without one (home, not found).
export function buildBreadcrumbs(root: ActivatedRouteSnapshot): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];
  let url = '';
  for (let route = root.firstChild; route; route = route.firstChild) {
    const path = route.url.map((segment) => segment.path).join('/');
    if (path) {
      url += `/${path}`;
    }
    // routeConfig, not route.data: empty-path children inherit their parent's data.
    const label = route.routeConfig?.data?.['breadcrumb'] as BreadcrumbLabel | undefined;
    if (label) {
      items.push({ label: typeof label === 'function' ? label(route.data) : label, url });
    }
  }
  return items.length ? [{ label: 'Home', url: '/' }, ...items] : [];
}

@Component({
  imports: [RouterLink],
  selector: 'app-breadcrumb',
  styleUrl: './breadcrumb.scss',
  templateUrl: './breadcrumb.html',
})
export class Breadcrumb {
  private readonly router = inject(Router);
  private readonly navigationEnd = toSignal(
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)),
  );

  protected readonly items = computed(() => {
    this.navigationEnd();
    return buildBreadcrumbs(this.router.routerState.snapshot.root);
  });

  constructor() {
    // The trail as schema.org data, so search results can show it too.
    const document = inject(DOCUMENT);
    effect(() => {
      const items = this.items();
      setStructuredData(document, 'ld-breadcrumb', items.length ? breadcrumbData(items) : null);
    });
  }
}
