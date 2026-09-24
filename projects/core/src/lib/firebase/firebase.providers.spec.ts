import { TestBed } from '@angular/core/testing';
import { FIREBASE_APP } from './firebase-app.token';
import {
  EMULATOR_FIREBASE_ENVIRONMENT,
  assertSafeFirebaseEnvironment,
  provideFirebase,
} from './firebase.providers';
import { FIRESTORE } from './firestore.token';

describe('Firebase providers', () => {
  it('should keep the emulator environment on a demo- project', () => {
    expect(EMULATOR_FIREBASE_ENVIRONMENT.useEmulators).toBe(true);
    expect(EMULATOR_FIREBASE_ENVIRONMENT.options.projectId).toMatch(/^demo-/);
  });

  it('should refuse to use emulators with a real project ID', () => {
    expect(() =>
      assertSafeFirebaseEnvironment({ options: { projectId: 'real-project' }, useEmulators: true }),
    ).toThrowError(/demo- project ID/);
  });

  it('should allow a real project ID when emulators are off', () => {
    expect(() =>
      assertSafeFirebaseEnvironment({
        options: { projectId: 'real-project' },
        useEmulators: false,
      }),
    ).not.toThrow();
  });

  describe('with the emulator environment', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [provideFirebase(EMULATOR_FIREBASE_ENVIRONMENT)],
      });
    });

    it('should initialize the app with the demo project', () => {
      expect(TestBed.inject(FIREBASE_APP).options.projectId).toBe('demo-bronze-horse');
    });

    it('should connect Firestore to the emulator only once across injectors', () => {
      const first = TestBed.inject(FIRESTORE);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideFirebase(EMULATOR_FIREBASE_ENVIRONMENT)],
      });
      expect(() => TestBed.inject(FIRESTORE)).not.toThrow();
      expect(TestBed.inject(FIRESTORE)).toBe(first);
    });
  });
});
