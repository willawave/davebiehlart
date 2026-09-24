import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AccessDeniedPage } from './access-denied-page';

describe('AccessDeniedPage', () => {
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessDeniedPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(AccessDeniedPage);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should explain the denial and focus the heading', () => {
    expect(element.querySelector('h1')?.textContent).toContain('Access denied');
    expect(document.activeElement).toBe(element.querySelector('h1'));
  });

  it('should link back to sign-in to try another account', () => {
    const link = element.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/');
    expect(link?.textContent).toContain('Sign in with another account');
  });
});
