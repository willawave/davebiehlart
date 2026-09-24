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

// The waiting path of each guard when the first auth state turns out to be "nobody"
// or an admin, not covered by auth-guard.spec.ts.
describe('auth guards (waiting for the first auth state)', () => {
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

  it('authGuard should send a visitor to sign-in once the auth state shows nobody', async () => {
    const result = run(authGuard);
    TestBed.tick();
    loading.set(false);
    TestBed.tick();
    expect(urlOf(await result)).toBe('/');
  });

  it('signedInRedirectGuard should show sign-in once the auth state shows nobody', async () => {
    const result = run(signedInRedirectGuard);
    TestBed.tick();
    loading.set(false);
    TestBed.tick();
    await expect(result).resolves.toBe(true);
  });

  it('signedInRedirectGuard should forward an admin once the auth state resolves', async () => {
    const result = run(signedInRedirectGuard);
    TestBed.tick();
    authorizedUser.set({ id: 'admin-uid', email: 'admin@test.com' });
    loading.set(false);
    TestBed.tick();
    expect(urlOf(await result)).toBe('/dashboard');
  });
});
