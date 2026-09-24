import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { AuthStore } from './auth/auth.store';
import { AuthorizedUser } from './auth/authorized-user.model';

// Route-level wiring of the auth guards and titles, beyond app.routes.regression-1.spec.ts.
describe('admin routes (auth wiring)', () => {
  const authorizedUser = signal<AuthorizedUser | null>(null);
  const store = { loading: signal(false), authorizedUser, error: signal<string | null>(null) };

  beforeEach(() => {
    authorizedUser.set(null);
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), { provide: AuthStore, useValue: store }],
    });
  });

  async function visit(url: string): Promise<string> {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    return TestBed.inject(Router).url;
  }

  it.each(['/dashboard', '/events', '/gallery-edit/x', '/media-add', '/statues'])(
    'should send a signed-out visitor on %s to sign-in',
    async (url) => {
      expect(await visit(url)).toBe('/');
      expect(TestBed.inject(Title).getTitle()).toBe('Sign In');
    },
  );

  it('should let a signed-out visitor see the access-denied page', async () => {
    expect(await visit('/access-denied')).toBe('/access-denied');
    expect(TestBed.inject(Title).getTitle()).toBe('Access Denied');
  });

  it('should forward a signed-in admin from sign-in to the dashboard', async () => {
    authorizedUser.set({ id: 'admin-uid', email: 'admin@test.com' });
    expect(await visit('/')).toBe('/dashboard');
    expect(TestBed.inject(Title).getTitle()).toBe('Dashboard');
  });
});
