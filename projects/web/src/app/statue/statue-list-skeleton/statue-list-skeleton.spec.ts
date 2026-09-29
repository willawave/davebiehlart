import { TestBed } from '@angular/core/testing';
import { StatueListSkeleton } from './statue-list-skeleton';

describe('StatueListSkeleton', () => {
  it('should hold the map’s place without announcing anything', async () => {
    const fixture = TestBed.createComponent(StatueListSkeleton);
    await fixture.whenStable();
    const box = (fixture.nativeElement as HTMLElement).querySelector('.box');
    expect(box?.getAttribute('aria-hidden')).toBe('true');
    expect(box?.textContent).toBe('');
  });
});
