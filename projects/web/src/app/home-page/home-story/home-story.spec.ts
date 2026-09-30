import { TestBed } from '@angular/core/testing';
import { HomeStory } from './home-story';

describe('HomeStory', () => {
  it('should tell the five chapters in order', async () => {
    const fixture = TestBed.createComponent(HomeStory);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('h2')?.textContent).toBe('From clay to bronze');
    const titles = [...element.querySelectorAll('ol h3')].map((h3) => h3.textContent);
    expect(titles).toEqual([
      'Raised on the ranch',
      'Doctor of Veterinary Medicine',
      'Sculpture in the Park',
      'Self-taught',
      'Commissions',
    ]);
  });
});
