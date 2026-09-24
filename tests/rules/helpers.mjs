// Shared setup for the security-rules suites.
//
// These run under Node against the emulators (`pnpm test:rules`), not under `ng test`.
// Keep them out of projects/ so no tsconfig.spec.json ever picks them up.
//
// `--test-concurrency=1` in that script is load-bearing: every suite shares one
// emulator and setup below clears it, so running files concurrently lets one suite wipe
// the `users` documents another suite's isAdmin() is mid-way through reading.

import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, setDoc } from 'firebase/firestore';

// Deliberately fake. Production UIDs and emails do not belong in this public repo, and
// the rules care only about the shape: a `users` document whose ID is the caller's UID.
export const ADMIN_UID = 'admin-uid-000000000000';
export const ADMIN_EMAIL = 'admin@example.com';
export const OUTSIDER_UID = 'outsider-uid-00000000';
export const OUTSIDER_EMAIL = 'outsider@example.com';

// A second admin exists purely so the /users read rule has something to fail against.
// With one admin on file, "read your own entry" and "admins read any entry" are
// indistinguishable, because the only document an admin could wrongly read is their own.
export const SECOND_ADMIN_UID = 'admin-uid-111111111111';
export const SECOND_ADMIN_EMAIL = 'second-admin@example.com';

export const CONTENT_COLLECTIONS = ['gallery', 'statue', 'event', 'schedule', 'media'];

// Ports come from firebase.json. The demo- prefix guarantees nothing reaches production.
export async function setupTestEnv() {
  const testEnv = await initializeTestEnvironment({
    projectId: 'demo-bronze-horse-rules',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
    storage: {
      rules: readFileSync('storage.rules', 'utf8'),
      host: '127.0.0.1',
      port: 9199,
    },
  });

  await testEnv.clearFirestore();
  await testEnv.clearStorage();

  // Provision admins exactly the way a human does it in the console: a `users`
  // document keyed by Auth UID. This is what isAdmin() looks for in both rulesets.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', ADMIN_UID), { email: ADMIN_EMAIL });
    await setDoc(doc(ctx.firestore(), 'users', SECOND_ADMIN_UID), {
      email: SECOND_ADMIN_EMAIL,
    });
  });

  return testEnv;
}

export function contexts(testEnv) {
  return {
    anon: testEnv.unauthenticatedContext(),
    outsider: testEnv.authenticatedContext(OUTSIDER_UID, { email: OUTSIDER_EMAIL }),
    admin: testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL }),
  };
}
