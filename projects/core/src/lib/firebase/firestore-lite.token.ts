import { InjectionToken, inject } from '@angular/core';
import { Firestore, connectFirestoreEmulator, getFirestore } from 'firebase/firestore/lite';
import { FIREBASE_APP } from './firebase-app.token';
import {
  EMULATOR_HOST,
  FIRESTORE_EMULATOR_PORT,
  connectToEmulatorOnce,
} from './firebase.providers';

// Firestore's lite SDK, for apps that only read (web). Each read is a plain one-off request,
// with no long-lived listen connection: iOS kills that connection when the phone locks or an
// app is backgrounded, and reads then wait on the dead request. admin keeps FIRESTORE.
export const FIRESTORE_LITE = /* @__PURE__ */ new InjectionToken<Firestore>('FIRESTORE_LITE', {
  providedIn: 'root',
  factory: () =>
    connectToEmulatorOnce(getFirestore(inject(FIREBASE_APP)), (db) =>
      connectFirestoreEmulator(db, EMULATOR_HOST, FIRESTORE_EMULATOR_PORT),
    ),
});
