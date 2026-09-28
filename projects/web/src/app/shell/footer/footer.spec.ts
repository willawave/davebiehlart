import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NAV_LINKS } from '../../shared/nav-links';
import { Footer } from './footer';

describe('Footer', () => {
  let fixture: ComponentFixture<Footer>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Footer);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should list every section in a footer nav', () => {
    const links = element.querySelectorAll('nav[aria-label="Footer"] a');
    expect(Array.from(links, (a) => [a.textContent?.trim(), a.getAttribute('href')])).toEqual(
      NAV_LINKS.map((link) => [link.label, link.path]),
    );
  });

  it('should link the brand home', () => {
    const brand = element.querySelector('a.brand');
    expect(brand?.textContent?.trim()).toBe('Dave Biehl Art');
    expect(brand?.getAttribute('href')).toBe('/');
  });

  it('should show the copyright for the current year', () => {
    expect(element.querySelector('.legal')?.textContent).toContain(
      `© ${new Date().getFullYear()} Dave Biehl Art`,
    );
  });

  it('should link the legal pages', () => {
    const legal = element.querySelectorAll('.legal a');
    const hrefs = Array.from(legal, (a) => a.getAttribute('href'));
    expect(hrefs).toContain('/privacy-policy');
    expect(hrefs).toContain('/terms-of-use');
  });

  it('should credit Willawave', () => {
    const credit = Array.from(element.querySelectorAll('a')).find(
      (a) => a.textContent?.trim() === 'Site by Willawave',
    );
    expect(credit?.getAttribute('href')).toBe('https://willawave.ai');
    expect(credit?.getAttribute('rel')).toBe('noopener');
  });
});
