import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { TermsOfUsePage } from './terms-of-use-page';

describe('TermsOfUsePage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('should show the terms with their date and links to contact and the privacy policy', async () => {
    const fixture = TestBed.createComponent(TermsOfUsePage);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('h1')?.textContent).toBe('Terms of Use');
    expect(element.querySelector('.updated')?.textContent).toBe('Last updated: September 29, 2026');
    expect(element.querySelector('a[href="/contact"]')).not.toBeNull();
    expect(element.querySelector('a[href="/privacy-policy"]')).not.toBeNull();
  });

  it('should set its description and share tags', () => {
    TestBed.createComponent(TermsOfUsePage);
    const meta = TestBed.inject(Meta);
    expect(meta.getTag("name='description'")?.content).toContain('copyright');
    expect(meta.getTag("property='og:url'")?.content).toBe('https://davebiehlart.com/terms-of-use');
  });
});
