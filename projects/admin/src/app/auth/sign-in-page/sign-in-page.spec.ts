import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthStore, SignInResult } from '../auth.store';
import { SignInPage } from './sign-in-page';

describe('SignInPage', () => {
  let fixture: ComponentFixture<SignInPage>;
  let element: HTMLElement;
  let navigate: ReturnType<typeof vi.spyOn>;
  const error = signal<string | null>(null);
  const store = { error, signInWithGoogle: vi.fn<() => Promise<SignInResult>>() };

  beforeEach(async () => {
    vi.clearAllMocks();
    error.set(null);
    await TestBed.configureTestingModule({
      imports: [SignInPage],
      providers: [provideRouter([]), { provide: AuthStore, useValue: store }],
    }).compileComponents();

    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(SignInPage);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  const button = () => element.querySelector('button') as HTMLButtonElement;

  it('should focus the heading on arrival', () => {
    expect(document.activeElement).toBe(element.querySelector('h1'));
  });

  it.each([
    ['authorized', '/dashboard'],
    ['denied', '/access-denied'],
  ] as const)('should navigate a %s sign-in to %s', async (result, url) => {
    store.signInWithGoogle.mockResolvedValueOnce(result);
    button().click();
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith(url));
  });

  it.each(['cancelled', 'failed'] as const)(
    'should stay on the page when sign-in is %s',
    async (result) => {
      store.signInWithGoogle.mockResolvedValueOnce(result);
      button().click();
      await fixture.whenStable();
      expect(navigate).not.toHaveBeenCalled();
      expect(button().textContent).toContain('Sign in with Google');
    },
  );

  it('should show a busy state and ignore repeat clicks while signing in', async () => {
    let finish!: (result: SignInResult) => void;
    store.signInWithGoogle.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
    button().click();
    button().click();
    await fixture.whenStable();
    expect(button().textContent).toContain('Signing in…');
    expect(button().getAttribute('aria-busy')).toBe('true');
    expect(store.signInWithGoogle).toHaveBeenCalledOnce();

    finish('cancelled');
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(button().textContent).toContain('Sign in with Google');
    });
  });

  it('should announce the store error', async () => {
    error.set('Sign-in failed. Please try again.');
    await fixture.whenStable();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Sign-in failed');
  });
});
