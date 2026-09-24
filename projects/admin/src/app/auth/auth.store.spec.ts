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
    currentUserId: vi.fn<() => string | null>(() => ADMIN.uid),
  };
  const unsubscribe = vi.fn();
  // Auth state callbacks resolve asynchronously; let their promises settle.
  const settle = () => new Promise((resolve) => setTimeout(resolve));

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

    it('should authorize an admin account that has no email', async () => {
      emitAuthState({ uid: ADMIN.uid, email: null } as User);
      await settle();
      expect(store.authorizedUser()).toEqual({ id: ADMIN.uid, email: '' });
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

    it('should ignore an admin check that fails after a newer auth state', async () => {
      let rejectCheck!: (error: Error) => void;
      service.isAdmin.mockReturnValueOnce(new Promise((_, reject) => (rejectCheck = reject)));
      emitAuthState(ADMIN);
      emitAuthState(null);
      rejectCheck(new Error('offline'));
      await settle();
      expect(store.error()).toBeNull();
      expect(store.authorizedUser()).toBeNull();
      expect(store.loading()).toBe(false);
    });

    it('should report a failed admin check and sign the unverified account out', async () => {
      service.isAdmin.mockRejectedValueOnce(new Error('offline'));
      emitAuthState(ADMIN);
      await settle();
      expect(store.authorizedUser()).toBeNull();
      expect(store.loading()).toBe(false);
      expect(store.error()).toContain('Could not verify admin access');
      expect(service.signOut).toHaveBeenCalledOnce();
    });

    it('should not sign out an account another tab signed in after a failed check', async () => {
      service.isAdmin.mockRejectedValueOnce(new Error('offline'));
      service.currentUserId.mockReturnValueOnce(OUTSIDER.uid);
      emitAuthState(ADMIN);
      await settle();
      expect(store.error()).toContain('Could not verify admin access');
      expect(service.signOut).not.toHaveBeenCalled();
    });

    it('should keep the failure when its sign-out reports a signed-out auth state', async () => {
      service.isAdmin.mockRejectedValueOnce(new Error('offline'));
      service.signOut.mockImplementationOnce(async () => emitAuthState(null));
      service.signInWithGoogle.mockResolvedValueOnce(ADMIN).mockResolvedValueOnce(ADMIN);
      await expect(store.signInWithGoogle()).resolves.toBe('failed');
      expect(store.error()).toContain('Could not verify admin access');
      expect(store.loading()).toBe(false);

      await expect(store.signInWithGoogle()).resolves.toBe('authorized');
      expect(service.isAdmin).toHaveBeenCalledTimes(2);
    });

    it('should keep the admin-check error when signing the account out also fails', async () => {
      service.isAdmin.mockRejectedValueOnce(new Error('offline'));
      service.signOut.mockRejectedValueOnce(new Error('offline'));
      emitAuthState(ADMIN);
      await settle();
      expect(store.error()).toContain('Could not verify admin access');
    });

    it('should recheck the same account after a failed check when the auth state repeats', async () => {
      service.isAdmin.mockRejectedValueOnce(new Error('offline'));
      emitAuthState(ADMIN);
      await settle();
      expect(store.error()).toContain('Could not verify admin access');

      emitAuthState(ADMIN);
      await settle();
      expect(service.isAdmin).toHaveBeenCalledTimes(2);
      expect(store.authorizedUser()).toEqual({ id: ADMIN.uid, email: ADMIN.email });
      expect(store.error()).toBeNull();
    });

    it('should not report a failed non-admin sign-out once a newer auth state arrived', async () => {
      let rejectSignOut!: (error: Error) => void;
      service.signOut.mockReturnValueOnce(new Promise((_, reject) => (rejectSignOut = reject)));
      emitAuthState(OUTSIDER);
      await vi.waitFor(() => expect(service.signOut).toHaveBeenCalledOnce());
      emitAuthState(null);
      rejectSignOut(new Error('offline'));
      await settle();
      expect(store.error()).toBeNull();
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

    it.each(['auth/popup-closed-by-user', 'auth/cancelled-popup-request'])(
      'should treat %s as cancelled, not an error',
      async (code) => {
        service.signInWithGoogle.mockRejectedValueOnce({ code });
        await expect(store.signInWithGoogle()).resolves.toBe('cancelled');
        expect(store.error()).toBeNull();
      },
    );

    it('should report any other failure', async () => {
      service.signInWithGoogle.mockRejectedValueOnce({ code: 'auth/network-request-failed' });
      await expect(store.signInWithGoogle()).resolves.toBe('failed');
      expect(store.error()).toBe('Sign-in failed. Please try again.');
    });

    it.each([new Error('boom'), 'boom', null])(
      'should report a sign-in failure without an error code (%s)',
      async (thrown) => {
        service.signInWithGoogle.mockRejectedValueOnce(thrown);
        await expect(store.signInWithGoogle()).resolves.toBe('failed');
        expect(store.error()).toBe('Sign-in failed. Please try again.');
      },
    );

    it('should share one admin check with the auth state listener', async () => {
      service.signInWithGoogle.mockResolvedValueOnce(OUTSIDER);
      const result = store.signInWithGoogle();
      await Promise.resolve();
      emitAuthState(OUTSIDER);
      await expect(result).resolves.toBe('denied');
      expect(service.isAdmin).toHaveBeenCalledOnce();
      expect(service.signOut).toHaveBeenCalledOnce();
    });

    it('should reuse a settled admin check when the same admin is reported again', async () => {
      emitAuthState(ADMIN);
      await settle();
      service.signInWithGoogle.mockResolvedValueOnce(ADMIN);
      await expect(store.signInWithGoogle()).resolves.toBe('authorized');
      expect(service.isAdmin).toHaveBeenCalledOnce();
    });

    it('should drop a sign-in whose admin check finishes after a sign-out', async () => {
      let resolveCheck!: (admin: boolean) => void;
      service.isAdmin.mockReturnValueOnce(new Promise((resolve) => (resolveCheck = resolve)));
      service.signInWithGoogle.mockResolvedValueOnce(ADMIN);
      const result = store.signInWithGoogle();
      await vi.waitFor(() => expect(service.isAdmin).toHaveBeenCalled());
      emitAuthState(null);
      resolveCheck(true);
      await expect(result).resolves.toBe('cancelled');
      expect(store.authorizedUser()).toBeNull();
    });

    it('should cancel a sign-in when the auth state switches to another account', async () => {
      let resolveCheck!: (admin: boolean) => void;
      service.isAdmin.mockReturnValueOnce(new Promise((resolve) => (resolveCheck = resolve)));
      service.signInWithGoogle.mockResolvedValueOnce(ADMIN);
      const result = store.signInWithGoogle();
      await vi.waitFor(() => expect(service.isAdmin).toHaveBeenCalledWith(ADMIN.uid));
      emitAuthState(OUTSIDER);
      resolveCheck(true);
      await expect(result).resolves.toBe('cancelled');
      await settle();
      expect(store.authorizedUser()).toBeNull();
      expect(service.isAdmin).toHaveBeenCalledWith(OUTSIDER.uid);
    });

    it('should report a failed admin check and check again on the next sign-in', async () => {
      service.isAdmin.mockRejectedValueOnce(new Error('offline'));
      service.signInWithGoogle.mockResolvedValueOnce(ADMIN).mockResolvedValueOnce(ADMIN);
      await expect(store.signInWithGoogle()).resolves.toBe('failed');
      expect(store.authorizedUser()).toBeNull();
      expect(store.error()).toContain('Could not verify admin access');

      await expect(store.signInWithGoogle()).resolves.toBe('authorized');
      expect(service.isAdmin).toHaveBeenCalledTimes(2);
      expect(store.error()).toBeNull();
    });

    it('should report a non-admin that could not be signed out', async () => {
      service.signInWithGoogle.mockResolvedValueOnce(OUTSIDER);
      service.signOut.mockRejectedValueOnce(new Error('offline'));
      await expect(store.signInWithGoogle()).resolves.toBe('denied');
      expect(store.authorizedUser()).toBeNull();
      expect(store.error()).toContain('signing it out failed');
    });

    it('should retry signing out a non-admin whose sign-out failed on the next attempt', async () => {
      service.signInWithGoogle.mockResolvedValueOnce(OUTSIDER).mockResolvedValueOnce(OUTSIDER);
      service.signOut.mockRejectedValueOnce(new Error('offline'));
      await expect(store.signInWithGoogle()).resolves.toBe('denied');
      await expect(store.signInWithGoogle()).resolves.toBe('denied');
      expect(service.signOut).toHaveBeenCalledTimes(2);
      expect(store.error()).toBeNull();
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

    it('should clear a previous error when signing out', async () => {
      service.signInWithGoogle.mockRejectedValueOnce({ code: 'auth/network-request-failed' });
      await store.signInWithGoogle();
      expect(store.error()).not.toBeNull();
      await store.signOut();
      expect(store.error()).toBeNull();
    });
  });
});
