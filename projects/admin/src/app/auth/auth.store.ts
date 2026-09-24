import { inject } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { User } from 'firebase/auth';
import { AuthService } from './auth.service';
import { AuthorizedUser } from './authorized-user.model';

interface AuthState {
  authorizedUser: AuthorizedUser | null;
  loading: boolean;
  error: string | null;
}

export type SignInResult = 'authorized' | 'denied' | 'cancelled' | 'failed';

// The outcome of one admin check; 'stale' means a newer auth state replaced it.
type Resolution = 'authorized' | 'denied' | 'failed' | 'stale';

const initialState: AuthState = {
  authorizedUser: null,
  loading: true,
  error: null,
};

// The user closed the popup or opened a second one; not an error worth showing.
const CANCELLED_CODES = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request']);

function toAuthorizedUser(user: User): AuthorizedUser {
  return { id: user.uid, email: user.email ?? '' };
}

function errorCode(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : undefined;
}

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, service = inject(AuthService)) => {
    // Auth state changes can overlap (e.g. a slow admin check, then a sign-out), so only
    // the latest one may write its result.
    let latestCheck = 0;
    // A popup sign-in reports its account both through its own result and through the
    // auth state listener. Both share this one check, so the store has a single writer.
    let current: { uid: string; result: Promise<Resolution> } | undefined;

    // Decides whether a signed-in account is an admin and writes the outcome. An account
    // without a `users/{uid}` document is signed straight back out.
    async function check(user: User, id: number): Promise<Resolution> {
      let admin: boolean;
      try {
        admin = await service.isAdmin(user.uid);
      } catch {
        if (id !== latestCheck) return 'stale';
        patchState(store, {
          authorizedUser: null,
          loading: false,
          error: 'Could not verify admin access. Please try again.',
        });
        return 'failed';
      }
      if (id !== latestCheck) return 'stale';
      if (admin) {
        patchState(store, { authorizedUser: toAuthorizedUser(user), loading: false, error: null });
        return 'authorized';
      }
      patchState(store, { authorizedUser: null, loading: false });
      try {
        await service.signOut();
      } catch {
        if (id === latestCheck) {
          patchState(store, {
            error: 'This account is not an admin, and signing it out failed. Please reload.',
          });
        }
      }
      return 'denied';
    }

    function resolve(user: User): Promise<Resolution> {
      if (current?.uid === user.uid) return current.result;
      const entry = { uid: user.uid, result: check(user, ++latestCheck) };
      current = entry;
      // A failed check may be retried by signing in again.
      void entry.result.then((resolution) => {
        if (resolution === 'failed' && current === entry) current = undefined;
      });
      return entry.result;
    }

    return {
      // Resolves a Firebase auth state into an authorized admin or nobody.
      async _resolveUser(user: User | null): Promise<void> {
        if (user) {
          await resolve(user);
          return;
        }
        ++latestCheck;
        current = undefined;
        patchState(store, { authorizedUser: null, loading: false });
      },

      async signInWithGoogle(): Promise<SignInResult> {
        patchState(store, { error: null });
        let user: User;
        try {
          user = await service.signInWithGoogle();
        } catch (error) {
          if (CANCELLED_CODES.has(errorCode(error) ?? '')) return 'cancelled';
          patchState(store, { error: 'Sign-in failed. Please try again.' });
          return 'failed';
        }
        const resolution = await resolve(user);
        // A newer auth state, such as a sign-out, replaced this sign-in.
        return resolution === 'stale' ? 'cancelled' : resolution;
      },

      async signOut(): Promise<void> {
        patchState(store, { error: null });
        try {
          await service.signOut();
          patchState(store, { authorizedUser: null });
        } catch {
          patchState(store, { error: 'Sign-out failed. Please try again.' });
        }
      },
    };
  }),
  withHooks((store, service = inject(AuthService)) => {
    let unsubscribe: (() => void) | undefined;
    return {
      onInit() {
        unsubscribe = service.authState((user) => void store._resolveUser(user));
      },
      onDestroy() {
        unsubscribe?.();
      },
    };
  }),
);
