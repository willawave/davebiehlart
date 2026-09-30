import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeExplore } from './home-explore';

describe('HomeExplore', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('should link to every section except Home and Contact, numbered', async () => {
    const fixture = TestBed.createComponent(HomeExplore);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    const links = [...element.querySelectorAll('.explore a')].map((a) => [
      a.querySelector('.index')?.textContent,
      a.getAttribute('href'),
    ]);
    expect(links).toEqual([
      ['01', '/bronzes'],
      ['02', '/statues'],
      ['03', '/glass'],
      ['04', '/events'],
      ['05', '/media'],
    ]);
  });

  it('should invite a commission through the Contact page', async () => {
    const fixture = TestBed.createComponent(HomeExplore);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    const cta = element.querySelector('.commission a');
    expect(cta?.textContent?.trim()).toBe('Talk with Dave');
    expect(cta?.getAttribute('href')).toBe('/contact');
  });
});
