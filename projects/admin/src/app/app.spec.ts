import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { App } from './app';
import { AuthStore } from './auth/auth.store';
import { AuthorizedUser } from './auth/authorized-user.model';

describe('App', () => {
  const authorizedUser = signal<AuthorizedUser | null>(null);
  const store = {
    authorizedUser,
    signOut: vi.fn(async () => authorizedUser.set(null)),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    authorizedUser.set(null);
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: AuthStore, useValue: store }],
    }).compileComponents();
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
