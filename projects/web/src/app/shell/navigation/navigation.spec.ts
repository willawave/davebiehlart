import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSidenav } from '@angular/material/sidenav';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { NAV_LINKS } from '../../shared/nav-links';
import { Navigation } from './navigation';

@Component({ template: '<p class="routed">{{ "routed page" }}</p>' })
class Page {}

describe('Navigation', () => {
  let harness: RouterTestingHarness;

  function element(): HTMLElement {
    return harness.fixture.nativeElement;
  }

  async function settle(): Promise<void> {
    harness.fixture.detectChanges();
    await harness.fixture.whenStable();
  }

  function sidenav(): MatSidenav {
    return harness.fixture.debugElement.query(By.directive(MatSidenav)).componentInstance;
  }

  function linksIn(label: string): [string | undefined, string | null][] {
    const links = element().querySelectorAll(`nav[aria-label="${label}"] a`);
    return Array.from(links, (a) => [a.textContent?.trim(), a.getAttribute('href')]);
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: '',
            component: Navigation,
            children: [
              { path: '', component: Page },
              { path: 'bronzes', component: Page },
            ],
          },
        ]),
      ],
    });
    harness = await RouterTestingHarness.create('/');
  });

  it('should render the routed page inside main', () => {
    expect(element().querySelector('main#main .routed')?.textContent).toBe('routed page');
  });

  it('should link every section in the header and the menu', () => {
    const expected = NAV_LINKS.map((link) => [link.label, link.path]);
    expect(linksIn('Main')).toEqual(expected);
    expect(linksIn('Menu')).toEqual(expected);
  });

  it('should link the brand home', () => {
    expect(element().querySelector('.brand')?.getAttribute('href')).toBe('/');
  });

  it('should offer a skip link to the main content', () => {
    const skip = element().querySelector('.skip-link');
    expect(skip?.getAttribute('href')).toBe('/#main');
    expect(element().querySelector('main')?.getAttribute('tabindex')).toBe('-1');
  });

  it('should focus the main content from the skip link without navigating', async () => {
    await harness.navigateByUrl('/bronzes');
    expect(element().querySelector('.skip-link')?.getAttribute('href')).toBe('/bronzes#main');
    document.body.appendChild(element());
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    element().querySelector('.skip-link')!.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(element().querySelector('main'));
    expect(TestBed.inject(Router).url).toBe('/bronzes');
    element().remove();
  });

  it('should mark only the current section', async () => {
    await harness.navigateByUrl('/bronzes');
    const current = element().querySelectorAll('nav[aria-label="Main"] a[aria-current="page"]');
    expect(Array.from(current, (a) => a.textContent?.trim())).toEqual(['Bronzes']);
  });

  it('should open the menu from the menu button', async () => {
    const menuButton = element().querySelector<HTMLButtonElement>('.menu-button')!;
    expect(menuButton.getAttribute('aria-expanded')).toBe('false');
    expect(sidenav().opened).toBe(false);

    menuButton.click();
    await settle();

    expect(sidenav().opened).toBe(true);
    expect(menuButton.getAttribute('aria-expanded')).toBe('true');
  });

  it('should close the menu from its close button', async () => {
    element().querySelector<HTMLButtonElement>('.menu-button')!.click();
    await settle();

    element().querySelector<HTMLButtonElement>('button[aria-label="Close menu"]')!.click();
    await settle();

    expect(sidenav().opened).toBe(false);
  });

  it('should close the menu after navigating', async () => {
    element().querySelector<HTMLButtonElement>('.menu-button')!.click();
    await settle();

    await TestBed.inject(Router).navigateByUrl('/bronzes');
    await settle();

    expect(sidenav().opened).toBe(false);
  });

  it('should close the menu when selecting the current page', async () => {
    element().querySelector<HTMLButtonElement>('.menu-button')!.click();
    await settle();

    element().querySelector<HTMLAnchorElement>('nav[aria-label="Menu"] a[href="/"]')!.click();
    await settle();

    expect(sidenav().opened).toBe(false);
  });
});
