import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withEnabledBlockingInitialNavigation,
  withInMemoryScrolling,
} from '@angular/router';
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
      // Without it, hydration runs before the first route resolves, then discards and
      // re-renders the server's page and breadcrumb (seen in a browser, 2026-09-28).
      withEnabledBlockingInitialNavigation(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    // Replays clicks made while blocking initial navigation holds hydration.
    provideClientHydration(withEventReplay()),
    provideFirebase(environment.firebase),
  ],
};
