import { TestBed } from '@angular/core/testing';
import type { User } from 'firebase/auth';
import { AuthService } from './auth.service';
import { AuthStore } from './auth.store';

const ADMIN = { uid: 'admin-uid', email: 'admin@test.com' } as User;
const OUTSIDER = { uid: 'outsider-uid', email: 'outsider@test.com' } as User;

// Branches of AuthStore not exercised by auth.store.spec.ts.
describe('AuthStore (edge cases)', () => {
  let store: InstanceType<typeof AuthStore>;
  let emitAuthState: (user: User | null) => void;
  const service = {
    authState: vi.fn((callback: (user: User | null) => void) => {
      emitAuthState = callback;
      return () => undefined;
    }),
    signInWithGoogle: vi.fn<() => Promise<User>>(),
    signOut: vi.fn(() => Promise.resolve()),
    isAdmin: vi.fn((uid: string) => Promise.resolve(uid === ADMIN.uid)),
  };
  const settle = () => new Promise((resolve) => setTimeout(resolve));

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: service }] });
    store = TestBed.inject(AuthStore);
  });

  it('should treat a superseded popup request as cancelled, not an error', async () => {
    service.signInWithGoogle.mockRejectedValueOnce({ code: 'auth/cancelled-popup-request' });
    await expect(store.signInWithGoogle()).resolves.toBe('cancelled');
    expect(store.error()).toBeNull();
  });

  it.each([new Error('boom'), 'boom', null])(
    'should report a sign-in failure without an error code (%s)',
    async (thrown) => {
      service.signInWithGoogle.mockRejectedValueOnce(thrown);
      await expect(store.signInWithGoogle()).resolves.toBe('failed');
      expect(store.error()).toBe('Sign-in failed. Please try again.');
    },
  );

  it('should authorize an admin account that has no email', async () => {
    emitAuthState({ uid: ADMIN.uid, email: null } as User);
    await settle();
    expect(store.authorizedUser()).toEqual({ id: ADMIN.uid, email: '' });
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

  it('should reuse a settled admin check when the same admin is reported again', async () => {
    emitAuthState(ADMIN);
    await settle();
    service.signInWithGoogle.mockResolvedValueOnce(ADMIN);
    await expect(store.signInWithGoogle()).resolves.toBe('authorized');
    expect(service.isAdmin).toHaveBeenCalledOnce();
  });

  it('should clear a previous error when signing out', async () => {
    service.signInWithGoogle.mockRejectedValueOnce({ code: 'auth/network-request-failed' });
    await store.signInWithGoogle();
    expect(store.error()).not.toBeNull();
    await store.signOut();
    expect(store.error()).toBeNull();
  });
});
