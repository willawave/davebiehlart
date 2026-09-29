/*
 * Public API Surface of core
 */

export * from './lib/core';
export * from './lib/const/base-location.const';
// The SDK tokens (FIRESTORE etc.) are exported from `core/firebase`; see firebase-api.ts.
export {
  EMULATOR_FIREBASE_ENVIRONMENT,
  type FirebaseEnvironment,
  provideFirebase,
} from './lib/firebase/firebase.providers';
export * from './lib/models/event.model';
export * from './lib/models/gallery.model';
export * from './lib/models/media.model';
export * from './lib/models/statue.model';
export * from './lib/utils/event-time';
export * from './lib/utils/media-link';
