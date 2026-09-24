import { FirebaseEnvironment } from 'core';

// Production. Paste the production Firebase web config into `options` when the first
// feature that talks to Firebase ships; until then any Firebase call fails loudly.
export const environment: { firebase: FirebaseEnvironment } = {
  firebase: { options: {}, useEmulators: false },
};
