import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { PrivacyPolicyPage } from './privacy-policy-page';

describe('PrivacyPolicyPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('should show the policy with its date, third-party links, and a contact link', async () => {
    const fixture = TestBed.createComponent(PrivacyPolicyPage);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('h1')?.textContent).toBe('Privacy Policy');
    expect(element.querySelector('.updated')?.textContent).toBe('Last updated: September 29, 2026');
    const external = element.querySelectorAll('a[target="_blank"]');
    expect(external.length).toBe(3);
    external.forEach((link) => {
      expect(link.getAttribute('rel')).toBe('noopener');
      expect(link.textContent).toContain('(opens in a new tab)');
    });
    expect(element.querySelector('a[href="/contact"]')).not.toBeNull();
  });

  it('should set its description and share tags', () => {
    TestBed.createComponent(PrivacyPolicyPage);
    const meta = TestBed.inject(Meta);
    expect(meta.getTag("name='description'")?.content).toContain('no tracking cookies');
    expect(meta.getTag("property='og:url'")?.content).toBe(
      'https://davebiehlart.com/privacy-policy',
    );
  });
});
