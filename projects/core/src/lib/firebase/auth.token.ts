import { InjectionToken, inject } from '@angular/core';
import { Auth, connectAuthEmulator, getAuth } from 'firebase/auth';
import { FIREBASE_APP } from './firebase-app.token';
import { AUTH_EMULATOR_PORT, EMULATOR_HOST, connectToEmulatorOnce } from './firebase.providers';

export const FIREBASE_AUTH = /* @__PURE__ */ new InjectionToken<Auth>('FIREBASE_AUTH', {
  providedIn: 'root',
  factory: () =>
    connectToEmulatorOnce(getAuth(inject(FIREBASE_APP)), (auth) =>
      connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${AUTH_EMULATOR_PORT}`, {
        disableWarnings: true,
      }),
    ),
});
