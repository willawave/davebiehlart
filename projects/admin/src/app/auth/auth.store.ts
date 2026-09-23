import { inject } from '@angular/core';
import { signalStore, withMethods, withState } from '@ngrx/signals';
import { User } from 'firebase/auth';
import { AuthService } from './auth.service';

interface AuthState {
  authorizedUser: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  authorizedUser: null,
  loading: true,
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, service = inject(AuthService)) => ({
    // Check for existing authorized user and update the state accordingly
    // Sign in with Google and update the state accordingly
    // Sign out and update the state accordingly
  })),
);
