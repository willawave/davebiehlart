import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { VisitHours } from '../../schedule/visit-hours/visit-hours';
import { ContactPage } from './contact-page';

@Component({ selector: 'app-visit-hours', template: '' })
class FakeVisitHours {}

describe('ContactPage', () => {
  it('should show the page heading and the gallery hours', async () => {
    TestBed.overrideComponent(ContactPage, {
      remove: { imports: [VisitHours] },
      add: { imports: [FakeVisitHours] },
    });
    const fixture = TestBed.createComponent(ContactPage);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('h1')?.textContent).toBe('Contact');
    expect(element.querySelector('app-visit-hours')).not.toBeNull();
  });
});
