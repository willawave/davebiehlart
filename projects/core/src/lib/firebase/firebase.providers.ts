import {
  EnvironmentProviders,
  InjectionToken,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import type { FirebaseOptions } from 'firebase/app';

// Only type imports from the Firebase SDK in this file. Each SDK is imported by its own
// token file (firebase-app / firestore / auth / storage .token.ts), and the SDKs have
// module side effects, so an SDK imported here would land in every app's initial bundle.

export interface FirebaseEnvironment {
  options: FirebaseOptions;
  useEmulators: boolean;
}

// Used by every development build. A `demo-` project ID exists only on the local
// emulators, so a call that misses them fails instead of reaching a real project. The
// API key is a placeholder: the Auth emulator accepts any string.
export const EMULATOR_FIREBASE_ENVIRONMENT: FirebaseEnvironment = {
  options: {
    projectId: 'demo-bronze-horse',
    apiKey: 'demo-api-key',
    authDomain: 'demo-bronze-horse.firebaseapp.com',
    storageBucket: 'demo-bronze-horse.appspot.com',
  },
  useEmulators: true,
};

// Must match the emulator ports in firebase.json.
export const EMULATOR_HOST = '127.0.0.1';
export const AUTH_EMULATOR_PORT = 9099;
export const FIRESTORE_EMULATOR_PORT = 8080;
export const STORAGE_EMULATOR_PORT = 9199;

export const FIREBASE_ENVIRONMENT = /* @__PURE__ */ new InjectionToken<FirebaseEnvironment>(
  'FIREBASE_ENVIRONMENT',
);

export function provideFirebase(environment: FirebaseEnvironment): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: FIREBASE_ENVIRONMENT, useValue: environment }]);
}

// Refuses to mix emulators with a real project, e.g. if production config is pasted into
// a development environment by mistake.
export function assertSafeFirebaseEnvironment(environment: FirebaseEnvironment): void {
  const projectId = environment.options.projectId ?? '';
  if (environment.useEmulators && !projectId.startsWith('demo-')) {
    throw new Error(
      `Firebase emulators require a demo- project ID, got "${projectId}". ` +
        'Never point a development build at a real Firebase project.',
    );
  }
}

// The SDK throws if an instance is connected to an emulator twice. Token factories re-run
// per injector (per SSR request, per TestBed), but getX(app) returns the same instance.
// Must be called from an injection context (a token factory).
const connectedToEmulator = new WeakSet<object>();

export function connectToEmulatorOnce<T extends object>(
  instance: T,
  connect: (instance: T) => void,
): T {
  if (inject(FIREBASE_ENVIRONMENT).useEmulators && !connectedToEmulator.has(instance)) {
    connect(instance);
    connectedToEmulator.add(instance);
  }
  return instance;
}
