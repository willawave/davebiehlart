import { isPlatformBrowser, PRECONNECT_CHECK_BLOCKLIST } from '@angular/common';
import {
  ApplicationConfig,
  ApplicationRef,
  inject,
  Injectable,
  PLATFORM_ID,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  PreloadingStrategy,
  provideRouter,
  Route,
  withComponentInputBinding,
  withInMemoryScrolling,
  withPreloading,
} from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideFirebase } from 'core';
import { catchError, EMPTY, from, Observable, switchMap } from 'rxjs';
import { environment } from '../environments/environment';

// Fetches every section's chunk once the first page has hydrated, so a later click on a slow
// connection waits only for its data. Preloading any sooner holds up hydration and the taps it
// replays. The server has no later clicks to serve. A failed fetch (say, a dropped connection)
// skips just that route: an error would end the router's preloading for the session.
@Injectable({ providedIn: 'root' })
export class PreloadAfterHydration implements PreloadingStrategy {
  private readonly stable = isPlatformBrowser(inject(PLATFORM_ID))
    ? inject(ApplicationRef).whenStable()
    : null;

  preload(_route: Route, load: () => Observable<unknown>): Observable<unknown> {
    return this.stable
      ? from(this.stable).pipe(
          switchMap(load),
          catchError(() => EMPTY),
        )
      : EMPTY;
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      withPreloading(PreloadAfterHydration),
    ),
    // The initial navigation keeps the app unstable, so hydration waits for the lazy route and
    // claims the server's page instead of re-rendering it (e2e/web/navigation.e2e.ts checks).
    // Event replay replays clicks made before hydration finishes.
    provideClientHydration(withEventReplay()),
    provideFirebase(environment.firebase),
    // Only /media loads YouTube stills, so they get no site-wide preconnect. NgOptimizedImage
    // reads this list at the root, so it can't be scoped to that page.
    { provide: PRECONNECT_CHECK_BLOCKLIST, useValue: 'https://i.ytimg.com' },
  ],
};
