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
  });
});
