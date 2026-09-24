import { InjectionToken, inject } from '@angular/core';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { FIREBASE_ENVIRONMENT, assertSafeFirebaseEnvironment } from './firebase.providers';

// Firebase's name for the default app (what initializeApp creates without a name).
const DEFAULT_APP_NAME = '[DEFAULT]';

// Reuses the default app when one exists: the factory re-runs per SSR request and per
// TestBed, and initializeApp throws if the default app is created twice. A reused app
// must belong to the same project, or assertSafeFirebaseEnvironment
// (firebase.providers.ts) would be bypassed. Named apps are ignored.
export const FIREBASE_APP = /* @__PURE__ */ new InjectionToken<FirebaseApp>('FIREBASE_APP', {
  providedIn: 'root',
  factory: () => {
    const environment = inject(FIREBASE_ENVIRONMENT);
    assertSafeFirebaseEnvironment(environment);
    if (!getApps().some((existing) => existing.name === DEFAULT_APP_NAME)) {
      return initializeApp(environment.options);
    }
    const app = getApp();
    if (app.options.projectId !== environment.options.projectId) {
      throw new Error(
        `The default Firebase app belongs to "${app.options.projectId}", but this ` +
          `environment expects "${environment.options.projectId}".`,
      );
    }
    return app;
  },
});
