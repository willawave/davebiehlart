import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, filter, map, take } from 'rxjs';
import { AuthStore } from './auth.store';

// Waits for the first auth state, then decides. This is UX only: the Firestore and
// Storage rules are what actually keep non-admins out.
function whenAuthKnown(
  decide: (authorized: boolean) => true | UrlTree,
): Observable<true | UrlTree> {
  const store = inject(AuthStore);
  return toObservable(store.loading).pipe(
    filter((loading) => !loading),
    take(1),
    map(() => decide(store.authorizedUser() !== null)),
  );
}

// Admin-only routes: anyone who isn't an authorized admin goes to sign-in.
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  return whenAuthKnown((authorized) => authorized || router.createUrlTree(['/']));
};

// The sign-in page: an admin who is already signed in skips it.
export const signedInRedirectGuard: CanActivateFn = () => {
  const router = inject(Router);
  return whenAuthKnown((authorized) => (authorized ? router.createUrlTree(['/dashboard']) : true));
};
