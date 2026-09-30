import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeHero } from './home-hero';

describe('HomeHero', () => {
  it('should show the headline and link to the bronzes and to Contact', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(HomeHero);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('h1')?.textContent).toBe('Shaped by the Nebraska plains.');
    const links = [...element.querySelectorAll('a')].map((a) => [
      a.textContent?.trim(),
      a.getAttribute('href'),
    ]);
    expect(links).toEqual([
      ['See the bronzes', '/bronzes'],
      ['Commission a piece', '/contact'],
    ]);
    expect(element.querySelector('.mark')?.getAttribute('aria-hidden')).toBe('true');
  });
});
