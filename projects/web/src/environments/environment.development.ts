import { EMULATOR_FIREBASE_ENVIRONMENT, FirebaseEnvironment } from 'core';

// Development (`ng serve`, `pnpm start`): local emulators only, never a real project.
export const environment: { firebase: FirebaseEnvironment } = {
  firebase: EMULATOR_FIREBASE_ENVIRONMENT,
};
