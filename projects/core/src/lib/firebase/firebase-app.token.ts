import { InjectionToken, inject } from '@angular/core';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { FIREBASE_ENVIRONMENT, assertSafeFirebaseEnvironment } from './firebase.providers';

// Reuses the default app when one exists: the factory re-runs per SSR request and per
// TestBed, and initializeApp throws if the default app is created twice.
export const FIREBASE_APP = /* @__PURE__ */ new InjectionToken<FirebaseApp>('FIREBASE_APP', {
  providedIn: 'root',
  factory: () => {
    const environment = inject(FIREBASE_ENVIRONMENT);
    assertSafeFirebaseEnvironment(environment);
    return getApps().length ? getApp() : initializeApp(environment.options);
  },
});
