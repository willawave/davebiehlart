import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomePlaces } from './home-places';

describe('HomePlaces', () => {
  it('should list the places, Henry Doorly Zoo first, and link to the statues', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(HomePlaces);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    const places = [...element.querySelectorAll('li')].map((li) => li.textContent);
    expect(places).toHaveLength(8);
    expect(places[0]).toBe('Henry Doorly Zoo');
    expect(element.querySelector('a')?.getAttribute('href')).toBe('/statues');
  });
});
