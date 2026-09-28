import { MediaMatcher } from '@angular/cdk/layout';
import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, PLATFORM_ID, Service, inject, signal } from '@angular/core';

export type Scheme = 'light' | 'dark';

// Also read by the inline script in index.html, which applies the choice before first paint.
export const COLOR_SCHEME_STORAGE_KEY = 'color-scheme';

@Service()
export class ColorSchemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // The server can't know the visitor's scheme; CSS follows the system until the browser takes over.
  readonly isLightMode = signal(false);

  constructor() {
    if (!this.isBrowser) {
      return;
    }
    const saved = this.readSaved();
    if (saved) {
      this.apply(saved);
    } else {
      const mediaMatcher = inject(MediaMatcher);
      this.isLightMode.set(mediaMatcher.matchMedia('(prefers-color-scheme: light)').matches);
    }
  }

  toggle(): void {
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
