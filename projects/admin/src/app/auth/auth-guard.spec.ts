import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { AuthStore } from './auth.store';
import { AuthorizedUser } from './authorized-user.model';
import { authGuard, signedInRedirectGuard } from './auth-guard';

describe('auth guards', () => {
  const loading = signal(true);
  const authorizedUser = signal<AuthorizedUser | null>(null);

  function run(guard: CanActivateFn): Promise<boolean | UrlTree> {
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    return firstValueFrom(result as Observable<boolean | UrlTree>);
  }

  function urlOf(result: boolean | UrlTree): string {
    return TestBed.inject(Router).serializeUrl(result as UrlTree);
  }

  beforeEach(() => {
    loading.set(true);
    authorizedUser.set(null);
    TestBed.configureTestingModule({
      providers: [{ provide: AuthStore, useValue: { loading, authorizedUser } }],
    });
  });

  describe('authGuard', () => {
    it('should wait for the auth state before deciding', async () => {
      let settled = false;
      const result = run(authGuard).then((value) => {
        settled = true;
        return value;
      });
      TestBed.tick();
      await Promise.resolve();
      expect(settled).toBe(false);

      authorizedUser.set({ id: 'admin-uid', email: 'admin@test.com' });
      loading.set(false);
      TestBed.tick();
      await expect(result).resolves.toBe(true);
    });

    it('should allow an authorized admin', async () => {
      authorizedUser.set({ id: 'admin-uid', email: 'admin@test.com' });
      loading.set(false);
      await expect(run(authGuard)).resolves.toBe(true);
    });

    it('should send anyone else to sign-in', async () => {
      loading.set(false);
      expect(urlOf(await run(authGuard))).toBe('/');
    });

    it('should send a visitor to sign-in once the auth state shows nobody', async () => {
      const result = run(authGuard);
      TestBed.tick();
      loading.set(false);
      TestBed.tick();
      expect(urlOf(await result)).toBe('/');
    });

    // toObservable's effect lives until the root injector is destroyed, so once the auth
    // state is known the guard must decide without creating one. It emits synchronously.
    it('should decide synchronously once the auth state is known', () => {
      authorizedUser.set({ id: 'admin-uid', email: 'admin@test.com' });
      loading.set(false);
      let value: boolean | UrlTree | undefined;
      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      ) as Observable<boolean | UrlTree>;
      result.subscribe((emitted) => (value = emitted));
      expect(value).toBe(true);
    });
  });

  describe('signedInRedirectGuard', () => {
    it('should send an authorized admin to the dashboard', async () => {
      authorizedUser.set({ id: 'admin-uid', email: 'admin@test.com' });
      loading.set(false);
      expect(urlOf(await run(signedInRedirectGuard))).toBe('/dashboard');
    });

    it('should show sign-in to anyone else', async () => {
      loading.set(false);
      await expect(run(signedInRedirectGuard)).resolves.toBe(true);
    });

    it('should show sign-in once the auth state shows nobody', async () => {
      const result = run(signedInRedirectGuard);
      TestBed.tick();
      loading.set(false);
      TestBed.tick();
      await expect(result).resolves.toBe(true);
    });

    it('should forward an admin once the auth state resolves', async () => {
      const result = run(signedInRedirectGuard);
      TestBed.tick();
      authorizedUser.set({ id: 'admin-uid', email: 'admin@test.com' });
      loading.set(false);
      TestBed.tick();
      expect(urlOf(await result)).toBe('/dashboard');
    });
  });
});
