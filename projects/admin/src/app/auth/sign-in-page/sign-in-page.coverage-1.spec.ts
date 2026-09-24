import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthStore, SignInResult } from '../auth.store';
import { SignInPage } from './sign-in-page';

// SignInPage branches not covered by sign-in-page.spec.ts.
describe('SignInPage (edge cases)', () => {
  let fixture: ComponentFixture<SignInPage>;
  let element: HTMLElement;
  const error = signal<string | null>(null);
  const store = { error, signInWithGoogle: vi.fn<() => Promise<SignInResult>>() };

  beforeEach(async () => {
    vi.clearAllMocks();
    error.set(null);
    await TestBed.configureTestingModule({
      imports: [SignInPage],
      providers: [provideRouter([]), { provide: AuthStore, useValue: store }],
    }).compileComponents();

    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(SignInPage);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  const button = () => element.querySelector('button') as HTMLButtonElement;

  it('should leave the busy state even if sign-in throws unexpectedly', async () => {
    store.signInWithGoogle.mockRejectedValueOnce(new Error('unexpected'));
    await expect(fixture.componentInstance['signIn']()).rejects.toThrow('unexpected');
    await fixture.whenStable();
    expect(button().textContent).toContain('Sign in with Google');
    expect(button().getAttribute('aria-busy')).toBe('false');
  });

  it('should allow another attempt after a cancelled sign-in', async () => {
    store.signInWithGoogle.mockResolvedValueOnce('cancelled').mockResolvedValueOnce('cancelled');
    button().click();
    await vi.waitFor(() => expect(store.signInWithGoogle).toHaveBeenCalledOnce());
    await fixture.whenStable();
    button().click();
    await vi.waitFor(() => expect(store.signInWithGoogle).toHaveBeenCalledTimes(2));
  });

  it('should remove the alert once the store error clears', async () => {
    error.set('Sign-in failed. Please try again.');
    await fixture.whenStable();
    expect(element.querySelector('[role="alert"]')).not.toBeNull();
    error.set(null);
    await fixture.whenStable();
    expect(element.querySelector('[role="alert"]')).toBeNull();
  });
});
