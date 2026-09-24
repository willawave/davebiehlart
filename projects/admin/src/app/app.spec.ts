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
  let finishLoading: (component: typeof Blank) => void;
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
          { path: 'access-denied', component: Blank },
          { path: 'dashboard', canActivate: [authGuard], component: Blank },
          {
            path: 'lazy',
            canActivate: [authGuard],
            loadComponent: () => new Promise((resolve) => (finishLoading = resolve)),
          },
          {
            path: 'section',
            children: [{ path: 'page', canActivate: [authGuard], component: Blank }],
          },
        ]),
        { provide: AuthStore, useValue: store },
      ],
    }).compileComponents();
  });

  describe('when the session ends', () => {
    async function openAt(url: string) {
      authorizedUser.set({ id: 'admin-uid', email: 'admin@test.com' });
      const fixture = TestBed.createComponent(App);
      const router = TestBed.inject(Router);
      await router.navigateByUrl(url);
      await fixture.whenStable();
      expect(router.url).toBe(url);
      return { fixture, router };
    }

    it.each(['/dashboard', '/section/page'])(
      'should return to sign-in from the guarded page %s',
      async (url) => {
        const { fixture, router } = await openAt(url);
        // e.g. a sign-out in another tab
        authorizedUser.set(null);
        await vi.waitFor(async () => {
          await fixture.whenStable();
          expect(router.url).toBe('/');
        });
      },
    );

    it('should return to sign-in when the session ends while a guarded page is loading', async () => {
      const { fixture, router } = await openAt('/access-denied');
      const navigation = router.navigateByUrl('/lazy');
      await vi.waitFor(() => expect(finishLoading).toBeDefined());
      // The guard has passed; the session ends before the lazy page arrives.
      authorizedUser.set(null);
      TestBed.tick();
      finishLoading(Blank);
      await navigation;
      await vi.waitFor(async () => {
        await fixture.whenStable();
        expect(router.url).toBe('/');
      });
    });

    it('should not redirect while the auth state is reloading', async () => {
      const { fixture, router } = await openAt('/dashboard');
      loading.set(true);
      authorizedUser.set(null);
      await fixture.whenStable();
      expect(router.url).toBe('/dashboard');
    });

    it('should leave an unguarded page alone', async () => {
      const { fixture, router } = await openAt('/access-denied');
      const navigate = vi.spyOn(router, 'navigateByUrl');
      authorizedUser.set(null);
      await fixture.whenStable();
      expect(router.url).toBe('/access-denied');
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe('toolbar', () => {
    async function render(): Promise<HTMLElement> {
      const fixture = TestBed.createComponent(App);
      await fixture.whenStable();
      return fixture.nativeElement as HTMLElement;
    }

    it('should show the site name without account controls when signed out', async () => {
      const element = await render();
      expect(element.querySelector('header')?.textContent).toContain('Dave Biehl Art');
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
});
