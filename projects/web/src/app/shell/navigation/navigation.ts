import { Location, ViewportScroller } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { EventPhase } from '@angular/core/primitives/event-dispatch';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
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

// The page must scroll past CONDENSE_AT to condense the header and back above EXPAND_AT to
// expand it. Condensing pulls the content up, and the gap keeps that from flipping it back.
const CONDENSE_AT = 120;
const EXPAND_AT = 8;

@Component({
  imports: [
    Breadcrumb,
    ColorScheme,
    Footer,
    MatIcon,
    MatIconButton,
    MatProgressBar,
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
  protected readonly condensed = signal(false);
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  private readonly masthead = viewChild.required<ElementRef<HTMLElement>>('masthead');
  private readonly router = inject(Router);
  // True while a click's page is still loading (its chunk or data), so a slow connection shows
  // progress. The first navigation is skipped: it stays pending while the server's page hydrates.
  protected readonly navigating = computed(() => (this.router.currentNavigation()?.id ?? 0) > 1);
  // Seeded from Location, not router.url: the shell hydrates before the router commits the
  // first URL, and until then router.url is "/".
  private readonly url = signal(inject(Location).path(true) || '/');
  private readonly injector = inject(Injector);
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
    // Router anchor scrolling lands below the sticky header, not under it.
    inject(ViewportScroller).setOffset(() => [0, this.masthead().nativeElement.offsetHeight]);
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const update = () =>
        this.condensed.update((condensed) =>
          condensed ? window.scrollY > EXPAND_AT : window.scrollY > CONDENSE_AT,
        );
      update();
      window.addEventListener('scroll', update, { passive: true });
      destroyRef.onDestroy(() => window.removeEventListener('scroll', update));
    });
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        const previousPath = this.path();
        this.url.set(this.router.url);
        // The first load can end after the page is interactive (its chunk loads lazily), so a
        // tap may already have opened the menu. Only a later navigation closes it.
        if (event.id > 1) {
          this.menuOpen.set(false);
        }
        // After moving to another page (not the first load, not a fragment or query change),
        // start keyboard and screen reader users at the new content. It waits for the next
        // render: an open drawer keeps <main> inert until that render closes it, and closing
        // hands focus back to the menu button.
        if (event.id > 1 && this.path() !== previousPath) {
          afterNextRender(() => this.main().nativeElement.focus({ preventScroll: true }), {
            injector: this.injector,
          });
        }
      });
  }

  protected skipToMain(event: Event): void {
    // A press before hydration is replayed after the browser already followed the #main href,
    // which also moved focus, so there's nothing left to cancel (Angular errors if we try).
    if (event.eventPhase === EventPhase.REPLAY) {
      return;
    }
    event.preventDefault();
    this.main().nativeElement.focus();
  }
}
