import { FirebaseEnvironment } from 'core';

// Production: the live "The Bronze Horse" project. Only production builds (`ng build`) use
// this file; development builds and tests swap in environment.development.ts, which points
// at the local emulators. A production admin build writes real data, so never serve one
// locally. The web config is public by design and is not a secret; see README.md →
// "Firebase config is not a secret".
export const environment: { firebase: FirebaseEnvironment } = {
  firebase: {
    options: {
      apiKey: 'AIzaSyCO4OeQcsGeSBA9DC_gb4fn1nLK2YvRKkg',
      appId: '1:613491520483:web:fcb938d1584567838e66d6',
      authDomain: 'the-bronze-horse-b3aa2.firebaseapp.com',
      messagingSenderId: '613491520483',
      projectId: 'the-bronze-horse-b3aa2',
      storageBucket: 'the-bronze-horse-b3aa2.firebasestorage.app',
    },
    useEmulators: false,
  },
};
