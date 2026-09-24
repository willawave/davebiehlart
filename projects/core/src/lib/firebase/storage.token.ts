import { InjectionToken, inject } from '@angular/core';
import { FirebaseStorage, connectStorageEmulator, getStorage } from 'firebase/storage';
import { FIREBASE_APP } from './firebase-app.token';
import { EMULATOR_HOST, STORAGE_EMULATOR_PORT, connectToEmulatorOnce } from './firebase.providers';

export const FIREBASE_STORAGE = /* @__PURE__ */ new InjectionToken<FirebaseStorage>(
  'FIREBASE_STORAGE',
  {
    providedIn: 'root',
    factory: () =>
      connectToEmulatorOnce(getStorage(inject(FIREBASE_APP)), (storage) =>
        connectStorageEmulator(storage, EMULATOR_HOST, STORAGE_EMULATOR_PORT),
      ),
  },
);
