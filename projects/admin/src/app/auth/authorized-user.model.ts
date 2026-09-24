// A signed-in account that has a `users/{uid}` document, i.e. an admin. Kept to plain data:
// the store deep-freezes its state in dev mode, and Firebase's `User` must stay mutable.
export interface AuthorizedUser {
  // The Firebase Auth UID, which is also the `users` document ID.
  id: string;
  email: string;
}
