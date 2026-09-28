import { Location } from '@angular/common';
import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import {
  NavigationEnd,
  PRIMARY_OUTLET,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { ColorScheme } from '../../color-scheme/color-scheme/color-scheme';
import { Breadcrumb } from '../../shared/breadcrumb/breadcrumb';
import { NAV_LINKS } from '../../shared/nav-links';
import { Site } from '../../shared/site.enum';
import { Footer } from '../footer/footer';

@Component({
  imports: [
    Breadcrumb,
    ColorScheme,
    Footer,
    MatIcon,
    MatIconButton,
    MatSidenav,
    MatSidenavContainer,
    MatSidenavContent,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  selector: 'app-navigation',
  styleUrl: './navigation.scss',
  templateUrl: './navigation.html',
})
export class Navigation {
  protected readonly links = NAV_LINKS;
  protected readonly siteTitle = Site.TITLE;
  protected readonly menuOpen = signal(false);
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  private readonly router = inject(Router);
  // Seeded from Location, not router.url: the shell hydrates before the initial navigation
  // ends, and until then router.url is "/".
  private readonly url = signal(inject(Location).path(true) || '/');
  // Path segments only, without query, matrix params, or fragment.
  private readonly path = computed(() => {
    const segments = this.router.parseUrl(this.url()).root.children[PRIMARY_OUTLET]?.segments;
    return `/${(segments ?? []).map((segment) => segment.path).join('/')}`;
  });
  // With <base href="/">, a bare "#main" resolves to "/#main" and would leave the current page,
  // so the href carries the current path, which also holds before hydration.
  protected readonly skipHref = computed(() => `${this.url().split('#')[0]}#main`);
  // aria-current for each link while routerLinkActive marks it: "page" for the page shown, "true"
  // for its section while a detail page is shown (the breadcrumb marks that page), so only one
  // link claims to be the page. It goes through ariaCurrentWhenActive because routerLinkActive
  // removes any other aria-current binding.
  protected readonly ariaCurrent = computed(() => {
    const path = this.path();
    return Object.fromEntries(
      this.links.map(({ path: link }) => [link, path === link ? 'page' : true]),
    ) as Record<string, 'page' | true>;
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.url.set(this.router.url);
        this.menuOpen.set(false);
      });
  }

  protected skipToMain(event: Event): void {
    event.preventDefault();
    this.main().nativeElement.focus();
  }
}
