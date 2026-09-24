import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { App } from './app';
import { authGuard } from './auth/auth-guard';
import { AuthStore } from './auth/auth.store';
import { AuthorizedUser } from './auth/authorized-user.model';

@Component({ template: '' })
class Blank {}

describe('App', () => {
  const loading = signal(false);
  const authorizedUser = signal<AuthorizedUser | null>(null);
  const store = {
    loading,
    authorizedUser,
    signOut: vi.fn(async () => authorizedUser.set(null)),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    loading.set(false);
    authorizedUser.set(null);
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: '', component: Blank },
          { path: 'dashboard', canActivate: [authGuard], component: Blank },
        ]),
        { provide: AuthStore, useValue: store },
      ],
    }).compileComponents();
  });

  it('should return to sign-in when the session ends on a guarded page', async () => {
    authorizedUser.set({ id: 'admin-uid', email: 'admin@test.com' });
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/dashboard');
    await fixture.whenStable();
    expect(router.url).toBe('/dashboard');

    // e.g. a sign-out in another tab
    authorizedUser.set(null);
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(router.url).toBe('/');
    });
  });

  async function render(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('should show the site name without account controls when signed out', async () => {
    const element = await render();
    expect(element.querySelector('header')?.textContent).toContain('The Bronze Horse');
    expect(element.querySelector('button')).toBeNull();
  });

  it('should show the admin email and sign out back to sign-in', async () => {
    authorizedUser.set({ id: 'admin-uid', email: 'admin@test.com' });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const element = await render();
    expect(element.querySelector('header')?.textContent).toContain('admin@test.com');

    element.querySelector('button')?.click();
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith('/'));
    expect(store.signOut).toHaveBeenCalledOnce();
  });

  it('should stay put when sign-out fails', async () => {
    authorizedUser.set({ id: 'admin-uid', email: 'admin@test.com' });
    store.signOut.mockResolvedValueOnce(undefined);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const element = await render();

    element.querySelector('button')?.click();
    await vi.waitFor(() => expect(store.signOut).toHaveBeenCalledOnce());
    expect(navigate).not.toHaveBeenCalled();
  });
});
