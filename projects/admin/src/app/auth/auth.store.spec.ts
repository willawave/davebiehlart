import { TestBed } from '@angular/core/testing';
import type { User } from 'firebase/auth';
import { AuthService } from './auth.service';
import { AuthStore } from './auth.store';

const ADMIN = { uid: 'admin-uid', email: 'admin@test.com' } as User;
const OUTSIDER = { uid: 'outsider-uid', email: 'outsider@test.com' } as User;

describe('AuthStore', () => {
  let store: InstanceType<typeof AuthStore>;
  let emitAuthState: (user: User | null) => void;
  const service = {
    authState: vi.fn((callback: (user: User | null) => void) => {
      emitAuthState = callback;
      return unsubscribe;
    }),
    signInWithGoogle: vi.fn<() => Promise<User>>(),
    signOut: vi.fn(() => Promise.resolve()),
    isAdmin: vi.fn((uid: string) => Promise.resolve(uid === ADMIN.uid)),
  };
  const unsubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: service }] });
    store = TestBed.inject(AuthStore);
  });

  it('should start with no user and loading until the auth state is known', () => {
    expect(store.authorizedUser()).toBeNull();
    expect(store.loading()).toBe(true);
    expect(store.error()).toBeNull();
  });

  it('should stop listening to auth state when destroyed', () => {
    TestBed.resetTestingModule();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  describe('auth state', () => {
    // Auth state callbacks resolve asynchronously; let their promises settle.
    const settle = () => new Promise((resolve) => setTimeout(resolve));

    it('should finish loading with no user when signed out', async () => {
      emitAuthState(null);
      await settle();
      expect(store.authorizedUser()).toBeNull();
      expect(store.loading()).toBe(false);
    });

    it('should authorize a signed-in admin by UID', async () => {
      emitAuthState(ADMIN);
      await settle();
      expect(service.isAdmin).toHaveBeenCalledWith(ADMIN.uid);
      expect(store.authorizedUser()).toEqual({ id: ADMIN.uid, email: ADMIN.email });
      expect(store.loading()).toBe(false);
    });

    it('should sign a non-admin straight back out', async () => {
      emitAuthState(OUTSIDER);
      await settle();
      expect(store.authorizedUser()).toBeNull();
      expect(store.loading()).toBe(false);
      expect(service.signOut).toHaveBeenCalledOnce();
    });

    it('should ignore an admin check that finishes after a newer auth state', async () => {
      let resolveCheck!: (admin: boolean) => void;
      service.isAdmin.mockReturnValueOnce(new Promise((resolve) => (resolveCheck = resolve)));
      emitAuthState(ADMIN);
      emitAuthState(null);
      resolveCheck(true);
      await settle();
      expect(store.authorizedUser()).toBeNull();
    });

    it('should report an error when the admin check fails', async () => {
      service.isAdmin.mockRejectedValueOnce(new Error('offline'));
      emitAuthState(ADMIN);
      await settle();
      expect(store.authorizedUser()).toBeNull();
      expect(store.loading()).toBe(false);
      expect(store.error()).toContain('Could not verify admin access');
    });
  });

  describe('signInWithGoogle', () => {
    it('should authorize an admin', async () => {
      service.signInWithGoogle.mockResolvedValueOnce(ADMIN);
      await expect(store.signInWithGoogle()).resolves.toBe('authorized');
      expect(store.authorizedUser()).toEqual({ id: ADMIN.uid, email: ADMIN.email });
    });

    it('should deny and sign out a non-admin', async () => {
      service.signInWithGoogle.mockResolvedValueOnce(OUTSIDER);
      await expect(store.signInWithGoogle()).resolves.toBe('denied');
      expect(store.authorizedUser()).toBeNull();
      expect(service.signOut).toHaveBeenCalledOnce();
    });

    it('should treat a closed popup as cancelled, not an error', async () => {
      service.signInWithGoogle.mockRejectedValueOnce({ code: 'auth/popup-closed-by-user' });
      await expect(store.signInWithGoogle()).resolves.toBe('cancelled');
      expect(store.error()).toBeNull();
    });

    it('should report any other failure', async () => {
      service.signInWithGoogle.mockRejectedValueOnce({ code: 'auth/network-request-failed' });
      await expect(store.signInWithGoogle()).resolves.toBe('cancelled');
      expect(store.error()).toBe('Sign-in failed. Please try again.');
    });
  });

  describe('signOut', () => {
    it('should sign out and clear the user', async () => {
      service.signInWithGoogle.mockResolvedValueOnce(ADMIN);
      await store.signInWithGoogle();
      await store.signOut();
      expect(service.signOut).toHaveBeenCalledOnce();
      expect(store.authorizedUser()).toBeNull();
    });

    it('should report a failed sign-out and keep the user', async () => {
      service.signInWithGoogle.mockResolvedValueOnce(ADMIN);
      await store.signInWithGoogle();
      service.signOut.mockRejectedValueOnce(new Error('offline'));
      await store.signOut();
      expect(store.error()).toBe('Sign-out failed. Please try again.');
      expect(store.authorizedUser()).not.toBeNull();
    });
  });
});
