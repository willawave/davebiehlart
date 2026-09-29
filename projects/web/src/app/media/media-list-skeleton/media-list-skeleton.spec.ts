import { TestBed } from '@angular/core/testing';
import { MediaListSkeleton } from './media-list-skeleton';

describe('MediaListSkeleton', () => {
  it('should announce loading and hide its placeholder rows from screen readers', async () => {
    const fixture = TestBed.createComponent(MediaListSkeleton);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('[role="status"]')?.textContent).toBe('Loading…');
    expect(element.querySelector('ul')?.getAttribute('aria-hidden')).toBe('true');
    expect(element.querySelectorAll('li').length).toBe(4);
  });
});
