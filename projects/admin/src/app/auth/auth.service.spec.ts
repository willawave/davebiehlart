import { TestBed } from '@angular/core/testing';
import { FIREBASE_AUTH, FIRESTORE } from 'core';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { AuthService } from './auth.service';

// signInWithPopup and getDoc need real SDK instances; they are covered by the E2E suite
// against the emulators and by tests/rules/firestore.rules.test.mjs.
describe('AuthService', () => {
  let service: AuthService;
  const fakeAuth = {
    currentUser: null as { uid: string } | null,
    onAuthStateChanged: vi.fn(() => () => undefined),
    signOut: vi.fn(() => Promise.resolve()),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: FIREBASE_AUTH, useValue: fakeAuth as unknown as Auth },
        { provide: FIRESTORE, useValue: {} as Firestore },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should forward auth state changes and return the unsubscribe function', () => {
    const unsubscribe = vi.fn();
    fakeAuth.onAuthStateChanged.mockReturnValueOnce(unsubscribe);
    const callback = vi.fn();

    expect(service.authState(callback)).toBe(unsubscribe);
    expect(fakeAuth.onAuthStateChanged).toHaveBeenCalledWith(callback, undefined, undefined);
  });

  it("should report the current user's UID, or null when signed out", () => {
    fakeAuth.currentUser = null;
    expect(service.currentUserId()).toBeNull();
    fakeAuth.currentUser = { uid: 'admin-uid' };
    expect(service.currentUserId()).toBe('admin-uid');
  });

  it('should sign out of Firebase Auth', async () => {
    await service.signOut();
    expect(fakeAuth.signOut).toHaveBeenCalledOnce();
  });
});
