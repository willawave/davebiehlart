import { TestBed } from '@angular/core/testing';
import { deleteApp, getApps, initializeApp } from 'firebase/app';
import { FIREBASE_AUTH } from './auth.token';
import { FIREBASE_APP } from './firebase-app.token';
import {
  EMULATOR_FIREBASE_ENVIRONMENT,
  FirebaseEnvironment,
  assertSafeFirebaseEnvironment,
  connectToEmulatorOnce,
  provideFirebase,
} from './firebase.providers';
import { FIRESTORE } from './firestore.token';
import { FIREBASE_STORAGE } from './storage.token';

const REAL: FirebaseEnvironment = { options: { projectId: 'real-project' }, useEmulators: false };

function configure(environment: FirebaseEnvironment): void {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideFirebase(environment)] });
}

describe('Firebase providers', () => {
  // The default app outlives TestBed resets; delete it so every test starts clean.
  afterEach(async () => {
    await Promise.all(getApps().map((app) => deleteApp(app)));
  });

  it('should keep the emulator environment on a demo- project', () => {
    expect(EMULATOR_FIREBASE_ENVIRONMENT.useEmulators).toBe(true);
    expect(EMULATOR_FIREBASE_ENVIRONMENT.options.projectId).toMatch(/^demo-/);
  });

  describe('assertSafeFirebaseEnvironment', () => {
    it('should refuse emulators with a real project ID, even in production mode', () => {
      expect(() => assertSafeFirebaseEnvironment({ ...REAL, useEmulators: true }, false)).toThrow(
        /demo- project ID/,
      );
    });

    it('should refuse a real project ID in a development build', () => {
      expect(() => assertSafeFirebaseEnvironment(REAL, true)).toThrow(/demo- project ID/);
    });

    it('should allow a real project ID only in a production build without emulators', () => {
      expect(() => assertSafeFirebaseEnvironment(REAL, false)).not.toThrow();
    });

    it('should refuse a development build with emulators off, even with a demo- ID', () => {
      const mixed: FirebaseEnvironment = {
        options: { projectId: 'demo-bronze-horse', storageBucket: 'real-project.appspot.com' },
        useEmulators: false,
      };
      expect(() => assertSafeFirebaseEnvironment(mixed, true)).toThrow(
        /must use the Firebase emulators/,
      );
    });

    it('should allow the emulator environment in a development build', () => {
      expect(() =>
        assertSafeFirebaseEnvironment(EMULATOR_FIREBASE_ENVIRONMENT, true),
      ).not.toThrow();
    });

    it('should allow the emulator environment in a production build', () => {
      expect(() =>
        assertSafeFirebaseEnvironment(EMULATOR_FIREBASE_ENVIRONMENT, false),
      ).not.toThrow();
    });

    // Mirrors the placeholder in the apps' environment.ts until the production config lands.
    const PLACEHOLDER: FirebaseEnvironment = { options: {}, useEmulators: false };

    it('should refuse the empty production placeholder with a clear message', () => {
      expect(() => assertSafeFirebaseEnvironment(PLACEHOLDER, false)).toThrow(/projectId is empty/);
    });

    it('should refuse a missing project ID in a development build', () => {
      expect(() => assertSafeFirebaseEnvironment(PLACEHOLDER, true)).toThrow(/projectId is empty/);
    });

    it('should refuse emulators without a project ID', () => {
      expect(() =>
        assertSafeFirebaseEnvironment({ options: {}, useEmulators: true }, false),
      ).toThrow(/projectId is empty/);
    });
  });

  describe('connectToEmulatorOnce', () => {
    it('should connect an instance once, even across injectors', () => {
      const instance = {};
      const connect = vi.fn();
      configure(EMULATOR_FIREBASE_ENVIRONMENT);
      TestBed.runInInjectionContext(() => connectToEmulatorOnce(instance, connect));
      configure(EMULATOR_FIREBASE_ENVIRONMENT);
      TestBed.runInInjectionContext(() => connectToEmulatorOnce(instance, connect));
      expect(connect).toHaveBeenCalledTimes(1);
      expect(connect).toHaveBeenCalledWith(instance);
    });

    it('should rethrow the original connect error instead of retrying', () => {
      const instance = {};
      const original = new Error('connect failed');
      const connect = vi.fn(() => {
        throw original;
      });
      configure(EMULATOR_FIREBASE_ENVIRONMENT);
      expect(() =>
        TestBed.runInInjectionContext(() => connectToEmulatorOnce(instance, connect)),
      ).toThrow(original);
      configure(EMULATOR_FIREBASE_ENVIRONMENT);
      expect(() =>
        TestBed.runInInjectionContext(() => connectToEmulatorOnce(instance, connect)),
      ).toThrow(original);
      expect(connect).toHaveBeenCalledTimes(1);
    });

    it('should never connect when emulators are off', () => {
      const connect = vi.fn();
      configure(REAL);
      TestBed.runInInjectionContext(() => connectToEmulatorOnce({}, connect));
      expect(connect).not.toHaveBeenCalled();
    });
  });

  describe('FIREBASE_APP', () => {
    it('should initialize the app with the environment project', () => {
      configure(EMULATOR_FIREBASE_ENVIRONMENT);
      expect(TestBed.inject(FIREBASE_APP).options.projectId).toBe('demo-bronze-horse');
    });

    it('should refuse to reuse a default app from another project', () => {
      initializeApp({ projectId: 'demo-some-other-project' });
      configure(EMULATOR_FIREBASE_ENVIRONMENT);
      expect(() => TestBed.inject(FIREBASE_APP)).toThrow(/demo-some-other-project/);
    });

    it('should refuse to reuse a same-project app pointed at a different bucket', () => {
      initializeApp({
        ...EMULATOR_FIREBASE_ENVIRONMENT.options,
        storageBucket: 'real-project.appspot.com',
      });
      configure(EMULATOR_FIREBASE_ENVIRONMENT);
      expect(() => TestBed.inject(FIREBASE_APP)).toThrow(/storageBucket/);
    });

    it('should refuse a real project in this development-mode test run', () => {
      configure(REAL);
      expect(() => TestBed.inject(FIREBASE_APP)).toThrow(/demo- project ID/);
    });
  });

  describe('service tokens with the emulator environment', () => {
    it('should provide Firestore, Auth, and Storage for the demo app', () => {
      configure(EMULATOR_FIREBASE_ENVIRONMENT);
      const app = TestBed.inject(FIREBASE_APP);
      expect(TestBed.inject(FIRESTORE).app).toBe(app);
      expect(TestBed.inject(FIREBASE_AUTH).app).toBe(app);
      expect(TestBed.inject(FIREBASE_STORAGE).app).toBe(app);
    });
  });
});
