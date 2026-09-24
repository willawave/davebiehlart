import { Service, inject } from '@angular/core';
import { FIREBASE_AUTH, FIRESTORE } from 'core';
import {
  GoogleAuthProvider,
  Unsubscribe,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

@Service()
export class AuthService {
  private readonly auth = inject(FIREBASE_AUTH);
  private readonly firestore = inject(FIRESTORE);

  authState(callback: (user: User | null) => void): Unsubscribe {
    return onAuthStateChanged(this.auth, callback);
  }

  async signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    // Always show Google's account chooser, or "Sign in with another account" silently
    // reuses the account that was just denied.
    provider.setCustomParameters({ prompt: 'select_account' });
    const credential = await signInWithPopup(this.auth, provider);
    return credential.user;
  }

  currentUserId(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  signOut(): Promise<void> {
    return signOut(this.auth);
  }

  // Admin status is keyed by UID only, never an email query (see firestore.rules). The
  // rules let a signed-in user get only their own `users` document.
  async isAdmin(uid: string): Promise<boolean> {
    const snapshot = await getDoc(doc(this.firestore, 'users', uid));
    return snapshot.exists();
  }
}
