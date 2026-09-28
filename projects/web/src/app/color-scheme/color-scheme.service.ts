import { MediaMatcher } from '@angular/cdk/layout';
import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, DestroyRef, PLATFORM_ID, Service, inject, signal } from '@angular/core';

export type Scheme = 'light' | 'dark';

// Also read by the inline script in index.html, which applies the choice before first paint.
export const COLOR_SCHEME_STORAGE_KEY = 'color-scheme';

@Service()
export class ColorSchemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // The server can't know the visitor's scheme; CSS follows the system until the browser takes over.
  readonly isLightMode = signal(false);

  private stopFollowingSystem = (): void => undefined;

  constructor() {
    if (!this.isBrowser) {
      return;
    }
    const saved = this.readSaved();
    if (saved) {
      this.apply(saved);
    } else {
      // Until the visitor picks a scheme, CSS follows the system live, so the toggle must too.
      const query = inject(MediaMatcher).matchMedia('(prefers-color-scheme: light)');
      this.isLightMode.set(query.matches);
      const follow = (event: MediaQueryListEvent) => this.isLightMode.set(event.matches);
      // addListener, not addEventListener: MediaMatcher's fallback query (no matchMedia) only
      // implements the older API, as CDK's own BreakpointObserver relies on.
      query.addListener(follow);
      this.stopFollowingSystem = () => query.removeListener(follow);
      inject(DestroyRef).onDestroy(() => this.stopFollowingSystem());
    }
  }

  toggle(): void {
    this.stopFollowingSystem();
    const next: Scheme = this.isLightMode() ? 'dark' : 'light';
    this.apply(next);
    try {
      localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, next);
    } catch {
      // Storage blocked (private mode, disabled site data): the choice lasts for this page only.
    }
  }

  private apply(scheme: Scheme): void {
    this.isLightMode.set(scheme === 'light');
    this.document.documentElement.style.colorScheme = scheme;
  }

  private readSaved(): Scheme | null {
    try {
      const saved = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
      return saved === 'light' || saved === 'dark' ? saved : null;
    } catch {
      return null;
    }
  }
}
