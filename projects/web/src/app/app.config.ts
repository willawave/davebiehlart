import { PRECONNECT_CHECK_BLOCKLIST } from '@angular/common';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideFirebase } from 'core';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
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
