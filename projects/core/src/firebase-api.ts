/*
 * Firebase SDK tokens, imported as `core/firebase`.
 *
 * Kept out of the main `core` entry on purpose. Each token file imports its SDK, and SDKs
 * have module side effects, so once any code injects a token, every bundle that can reach
 * its file statically also carries that SDK. Apps import `core` from their initial bundle
 * (app config, routes, models), so only services, which load lazily, import from here.
 */

export * from './lib/firebase/auth.token';
export * from './lib/firebase/firebase-app.token';
export * from './lib/firebase/firestore.token';
export * from './lib/firebase/firestore-lite.token';
export * from './lib/firebase/storage.token';
