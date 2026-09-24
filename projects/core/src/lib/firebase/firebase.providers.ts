import {
  EnvironmentProviders,
  InjectionToken,
  inject,
  isDevMode,
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

// Must match the emulator ports in firebase.json (enforced by
// tests/rules/emulator-config.test.mjs).
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

// Refuses to let a development build, or anything using the emulators, touch a real
// project. Development builds must use the emulators: checking the project ID alone is
// not enough, because a demo- ID with emulators off and a real storageBucket (or other
// real option) would send SDK calls to production. Only production builds may use a
// non-demo project ID or skip the emulators.
export function assertSafeFirebaseEnvironment(
  environment: FirebaseEnvironment,
  devMode = isDevMode(),
): void {
  const projectId = environment.options.projectId ?? '';
  if ((environment.useEmulators || devMode) && !projectId.startsWith('demo-')) {
    throw new Error(
      `Development builds and the Firebase emulators require a demo- project ID, got ` +
        `"${projectId}". Never point a development build at a real Firebase project.`,
    );
  }
  if (devMode && !environment.useEmulators) {
    throw new Error(
      'Development builds must use the Firebase emulators (useEmulators: true). ' +
        'Only production builds may talk to real Firebase services.',
    );
  }
}

// The SDK throws if an instance is connected to an emulator twice. Token factories re-run
// per injector (per SSR request, per TestBed), but getX(app) returns the same instance.
// The marker lives on the SDK instance, not in module state, so it survives the dev
// server re-evaluating this module (HMR) while the SDK singletons live on.
const CONNECTED_TO_EMULATOR = Symbol.for('davebiehlart.firebase.connectedToEmulator');
interface EmulatorMarked {
  [CONNECTED_TO_EMULATOR]?: true;
}

// Must be called from an injection context (a token factory).
export function connectToEmulatorOnce<T extends object>(
  instance: T,
  connect: (instance: T) => void,
): T {
  const marked = instance as T & EmulatorMarked;
  if (inject(FIREBASE_ENVIRONMENT).useEmulators && !marked[CONNECTED_TO_EMULATOR]) {
    connect(instance);
    marked[CONNECTED_TO_EMULATOR] = true;
  }
  return instance;
}
