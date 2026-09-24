import { TestBed } from '@angular/core/testing';
import { deleteApp, getApps, initializeApp } from 'firebase/app';
import { FIREBASE_AUTH } from './auth.token';
import { FIREBASE_APP } from './firebase-app.token';
import {
  AUTH_EMULATOR_PORT,
  EMULATOR_FIREBASE_ENVIRONMENT,
  EMULATOR_HOST,
  FIRESTORE_EMULATOR_PORT,
  STORAGE_EMULATOR_PORT,
  provideFirebase,
} from './firebase.providers';
import { FIRESTORE } from './firestore.token';
import { FIREBASE_STORAGE } from './storage.token';

function configureEmulators(): void {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideFirebase(EMULATOR_FIREBASE_ENVIRONMENT)] });
}

describe('Firebase tokens across injectors', () => {
  // The default app outlives TestBed resets; delete it so every test starts clean.
  afterEach(async () => {
    await Promise.all(getApps().map((app) => deleteApp(app)));
  });

  it('should reuse the default app of the same project in a new injector', () => {
    configureEmulators();
    const first = TestBed.inject(FIREBASE_APP);
    configureEmulators();
    expect(TestBed.inject(FIREBASE_APP)).toBe(first);
    expect(getApps().length).toBe(1);
  });

  it('should connect each service to its emulator', () => {
    configureEmulators();
    expect(TestBed.inject(FIREBASE_AUTH).emulatorConfig).toMatchObject({
      host: EMULATOR_HOST,
      port: AUTH_EMULATOR_PORT,
    });
    // Firestore and Storage expose no public getter for the emulator host; read the
    // settings the SDK serializes and the storage instance's private `_host` (checked
    // against @firebase/firestore 4.17.2 and @firebase/storage 0.14.5 — an SDK upgrade
    // may rename them even though the emulator wiring still works).
    const firestore = TestBed.inject(FIRESTORE).toJSON() as { settings?: { host?: string } };
    expect(firestore.settings?.host).toBe(`${EMULATOR_HOST}:${FIRESTORE_EMULATOR_PORT}`);
    const storage = TestBed.inject(FIREBASE_STORAGE) as unknown as { _host?: string };
    expect(storage._host).toBe(`${EMULATOR_HOST}:${STORAGE_EMULATOR_PORT}`);
  });

  it('should initialize the default app even when only a named app exists', () => {
    initializeApp({ projectId: 'demo-some-other-project' }, 'named');
    configureEmulators();
    const app = TestBed.inject(FIREBASE_APP);
    expect(app.name).toBe('[DEFAULT]');
    expect(app.options.projectId).toBe(EMULATOR_FIREBASE_ENVIRONMENT.options.projectId);
  });

  // Only proves instance reuse; the connect-once logic itself is covered by the
  // connectToEmulatorOnce tests in firebase.providers.spec.ts.
  it('should reuse the same SDK instances when a new injector re-runs the factories', () => {
    configureEmulators();
    const firestore = TestBed.inject(FIRESTORE);
    const auth = TestBed.inject(FIREBASE_AUTH);
    const storage = TestBed.inject(FIREBASE_STORAGE);
    configureEmulators();
    expect(TestBed.inject(FIRESTORE)).toBe(firestore);
    expect(TestBed.inject(FIREBASE_AUTH)).toBe(auth);
    expect(TestBed.inject(FIREBASE_STORAGE)).toBe(storage);
  });
});
