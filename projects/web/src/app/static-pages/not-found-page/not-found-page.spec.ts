import { RESPONSE_INIT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NAV_LINKS } from '../../shared/nav-links';
import { NotFoundPage } from './not-found-page';

describe('NotFoundPage', () => {
  it('should link home and to every other section', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(NotFoundPage);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('h1')?.textContent).toBe('Page not found');
    expect(element.querySelector('a.home')?.getAttribute('href')).toBe('/');
    const sections = [...element.querySelectorAll('nav a')].map((a) => a.getAttribute('href'));
    expect(sections).toEqual(NAV_LINKS.filter((l) => l.path !== '/').map((l) => l.path));
  });

  it('should set a 404 status when server-rendered', () => {
    const responseInit: ResponseInit = {};
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: RESPONSE_INIT, useValue: responseInit }],
    });
    TestBed.createComponent(NotFoundPage);
    expect(responseInit.status).toBe(404);
  });
});
