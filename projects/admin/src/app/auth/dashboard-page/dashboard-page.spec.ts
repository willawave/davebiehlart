import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
      providers: [provideRouter([]), { provide: AuthStore, useValue: { error, authorizedUser } }],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPage);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should show who is signed in and focus the heading', () => {
    expect(element.textContent).toContain('Signed in as admin@test.com');
    expect(document.activeElement).toBe(element.querySelector('h1'));
  });

  it('should link to each section it manages', () => {
    const links = Array.from(element.querySelectorAll('nav[aria-label="Manage"] a'), (a) => [
      a.textContent?.trim(),
      a.getAttribute('href'),
    ]);
    expect(links).toEqual([
      ['Gallery', '/gallery'],
      ['Statues', '/statues'],
      ['Events', '/events'],
      ['Media', '/media'],
      ['Schedule', '/schedule'],
    ]);
  });

  it('should announce a store error such as a failed sign-out', async () => {
    error.set('Sign-out failed. Please try again.');
    await fixture.whenStable();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Sign-out failed');
  });
});
