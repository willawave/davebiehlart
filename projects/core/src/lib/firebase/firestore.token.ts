import { InjectionToken, inject } from '@angular/core';
import { Firestore, connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { FIREBASE_APP } from './firebase-app.token';
import {
  EMULATOR_HOST,
  FIRESTORE_EMULATOR_PORT,
  connectToEmulatorOnce,
} from './firebase.providers';

export const FIRESTORE = /* @__PURE__ */ new InjectionToken<Firestore>('FIRESTORE', {
  providedIn: 'root',
  factory: () =>
    connectToEmulatorOnce(getFirestore(inject(FIREBASE_APP)), (db) =>
      connectFirestoreEmulator(db, EMULATOR_HOST, FIRESTORE_EMULATOR_PORT),
    ),
});
