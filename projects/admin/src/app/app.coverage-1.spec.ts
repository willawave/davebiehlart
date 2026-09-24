import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { App } from './app';
import { authGuard } from './auth/auth-guard';
import { AuthStore } from './auth/auth.store';
import { AuthorizedUser } from './auth/authorized-user.model';

@Component({ template: '' })
class Blank {}

// The session-ended redirect effect's non-redirecting branches, not covered by app.spec.ts.
describe('App (session-ended redirect)', () => {
  const loading = signal(false);
  const authorizedUser = signal<AuthorizedUser | null>(null);
  const store = { loading, authorizedUser, signOut: vi.fn(async () => undefined) };

  beforeEach(async () => {
    loading.set(false);
    authorizedUser.set({ id: 'admin-uid', email: 'admin@test.com' });
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: '', component: Blank },
          { path: 'access-denied', component: Blank },
          { path: 'dashboard', canActivate: [authGuard], component: Blank },
        ]),
        { provide: AuthStore, useValue: store },
      ],
    }).compileComponents();
  });

  async function openAt(url: string) {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl(url);
    await fixture.whenStable();
    return { fixture, router };
  }

  it('should not redirect while the auth state is reloading', async () => {
    const { fixture, router } = await openAt('/dashboard');
    loading.set(true);
    authorizedUser.set(null);
    await fixture.whenStable();
    expect(router.url).toBe('/dashboard');
  });

  it('should leave an unguarded page alone when the session ends', async () => {
    const { fixture, router } = await openAt('/access-denied');
    const navigate = vi.spyOn(router, 'navigateByUrl');
    authorizedUser.set(null);
    await fixture.whenStable();
    expect(router.url).toBe('/access-denied');
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe('App (guarded child route)', () => {
  const loading = signal(false);
  const authorizedUser = signal<AuthorizedUser | null>({
    id: 'admin-uid',
    email: 'admin@test.com',
  });

  beforeEach(async () => {
    authorizedUser.set({ id: 'admin-uid', email: 'admin@test.com' });
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: '', component: Blank },
          {
            path: 'section',
            children: [{ path: 'page', canActivate: [authGuard], component: Blank }],
          },
        ]),
        { provide: AuthStore, useValue: { loading, authorizedUser, signOut: vi.fn() } },
      ],
    }).compileComponents();
  });

  it('should find a guard on a nested route and return to sign-in', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/section/page');
    await fixture.whenStable();
    expect(router.url).toBe('/section/page');

    authorizedUser.set(null);
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(router.url).toBe('/');
    });
  });
});
