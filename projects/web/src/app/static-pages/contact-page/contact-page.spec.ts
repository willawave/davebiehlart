import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { VisitHours } from '../../schedule/visit-hours/visit-hours';
import { ContactPage } from './contact-page';

@Component({ selector: 'app-visit-hours', template: '' })
class FakeVisitHours {}

describe('ContactPage', () => {
  beforeEach(() => {
    TestBed.overrideComponent(ContactPage, {
      remove: { imports: [VisitHours] },
      add: { imports: [FakeVisitHours] },
    });
  });

  it('should show the page heading, email and phone links, and the gallery hours', async () => {
    const fixture = TestBed.createComponent(ContactPage);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('h1')?.textContent).toBe('Contact');
    expect(element.querySelector('a[href^="mailto:"]')?.getAttribute('href')).toBe(
      'mailto:dave.hvs50@gmail.com?subject=Dave%20Biehl%20Art',
    );
    const phone = element.querySelector('a[href^="tel:"]');
    expect(phone?.getAttribute('href')).toBe('tel:+14024600703');
    expect(phone?.textContent).toBe('(402) 460-0703');
    expect(element.querySelector('app-visit-hours')).not.toBeNull();
  });

  it('should set its description and share tags', () => {
    TestBed.createComponent(ContactPage);
    const meta = TestBed.inject(Meta);
    expect(meta.getTag("name='description'")?.content).toContain('Contact artist Dave Biehl');
    expect(meta.getTag("property='og:url'")?.content).toBe('https://davebiehlart.com/contact');
  });
});
