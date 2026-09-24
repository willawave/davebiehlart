// Regression: ISSUE-001 — an unknown admin URL rendered a blank page and logged NG04002
// Found by /qa on 2026-09-24
// Report: .gstack/qa-reports/qa-report-localhost-2026-09-24.md
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { AuthStore } from './auth/auth.store';
import { AuthorizedUser } from './auth/authorized-user.model';

describe('admin routes', () => {
  const authorizedUser = signal<AuthorizedUser | null>(null);
  const store = { loading: signal(false), authorizedUser, error: signal<string | null>(null) };

  beforeEach(() => {
    authorizedUser.set(null);
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), { provide: AuthStore, useValue: store }],
    });
  });

  it('should send a signed-out visitor on an unknown URL to sign-in', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/nope');
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('should send a signed-in admin on an unknown nested URL to the dashboard', async () => {
    authorizedUser.set({ id: 'admin-uid', email: 'admin@test.com' });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/events-edit/x/y');
    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });
});
