import { InjectionToken, inject } from '@angular/core';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { FIREBASE_ENVIRONMENT, assertSafeFirebaseEnvironment } from './firebase.providers';

// Reuses the default app when one exists: the factory re-runs per SSR request and per
// TestBed, and initializeApp throws if the default app is created twice. A reused app
// must belong to the same project, or the demo- guard above would be bypassed.
export const FIREBASE_APP = /* @__PURE__ */ new InjectionToken<FirebaseApp>('FIREBASE_APP', {
  providedIn: 'root',
  factory: () => {
    const environment = inject(FIREBASE_ENVIRONMENT);
    assertSafeFirebaseEnvironment(environment);
    if (!getApps().length) {
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
