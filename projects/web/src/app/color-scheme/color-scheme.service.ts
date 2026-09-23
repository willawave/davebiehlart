import { MediaMatcher } from '@angular/cdk/layout';
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ColorSchemeService {
  public isLightMode = signal<boolean>(false);

  constructor(mediaMatcher: MediaMatcher) {
    if (mediaMatcher.matchMedia('(prefers-color-scheme: light)').matches) {
      this.isLightMode.set(true);
    } else {
      this.isLightMode.set(false);
    }
  }
}
