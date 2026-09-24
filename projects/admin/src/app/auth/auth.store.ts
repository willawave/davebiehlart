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

export type SignInResult = 'authorized' | 'denied' | 'cancelled';

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

    return {
      // Resolves a Firebase auth state into an authorized admin or nobody. A signed-in
      // account without a `users/{uid}` document is signed straight back out.
      async _resolveUser(user: User | null): Promise<void> {
        const check = ++latestCheck;
        if (!user) {
          patchState(store, { authorizedUser: null, loading: false });
          return;
        }
        try {
          const admin = await service.isAdmin(user.uid);
          if (check !== latestCheck) return;
          if (admin) {
            patchState(store, { authorizedUser: toAuthorizedUser(user), loading: false });
          } else {
            patchState(store, { authorizedUser: null, loading: false });
            await service.signOut();
          }
        } catch {
          if (check !== latestCheck) return;
          patchState(store, {
            authorizedUser: null,
            loading: false,
            error: 'Could not verify admin access. Please try again.',
          });
        }
      },

      async signInWithGoogle(): Promise<SignInResult> {
        patchState(store, { error: null });
        try {
          const user = await service.signInWithGoogle();
          if (await service.isAdmin(user.uid)) {
            patchState(store, { authorizedUser: toAuthorizedUser(user) });
            return 'authorized';
          }
          patchState(store, { authorizedUser: null });
          await service.signOut();
          return 'denied';
        } catch (error) {
          if (CANCELLED_CODES.has(errorCode(error) ?? '')) return 'cancelled';
          patchState(store, { error: 'Sign-in failed. Please try again.' });
          return 'cancelled';
        }
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
