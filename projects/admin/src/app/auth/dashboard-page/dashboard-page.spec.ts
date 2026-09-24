import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthStore } from '../auth.store';
import { AuthorizedUser } from '../authorized-user.model';
import { DashboardPage } from './dashboard-page';

describe('DashboardPage', () => {
  let fixture: ComponentFixture<DashboardPage>;
  let element: HTMLElement;
  const error = signal<string | null>(null);
  const authorizedUser = signal<AuthorizedUser | null>({
    id: 'admin-uid',
    email: 'admin@test.com',
  });

  beforeEach(async () => {
    error.set(null);
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [{ provide: AuthStore, useValue: { error, authorizedUser } }],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPage);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should show who is signed in and focus the heading', () => {
    expect(element.textContent).toContain('Signed in as admin@test.com');
    expect(document.activeElement).toBe(element.querySelector('h1'));
  });

  it('should announce a store error such as a failed sign-out', async () => {
    error.set('Sign-out failed. Please try again.');
    await fixture.whenStable();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Sign-out failed');
  });
});
