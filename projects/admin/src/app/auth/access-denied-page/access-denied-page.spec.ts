import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthStore } from '../auth.store';
import { AccessDeniedPage } from './access-denied-page';

describe('AccessDeniedPage', () => {
  let fixture: ComponentFixture<AccessDeniedPage>;
  let element: HTMLElement;
  const error = signal<string | null>(null);

  beforeEach(async () => {
    error.set(null);
    await TestBed.configureTestingModule({
      imports: [AccessDeniedPage],
      providers: [provideRouter([]), { provide: AuthStore, useValue: { error } }],
    }).compileComponents();

    fixture = TestBed.createComponent(AccessDeniedPage);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should explain the denial and focus the heading', () => {
    expect(element.querySelector('h1')?.textContent).toContain('Access denied');
    expect(document.activeElement).toBe(element.querySelector('h1'));
    expect(element.querySelector('[role="alert"]')).toBeNull();
  });

  it('should link back to sign-in to try another account', () => {
    const link = element.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/');
    expect(link?.textContent).toContain('Sign in with another account');
  });

  it('should announce a store error such as a failed non-admin sign-out', async () => {
    error.set('This account is not an admin, and signing it out failed. Please try again.');
    await fixture.whenStable();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('signing it out failed');
  });
});
