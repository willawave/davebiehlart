// Regression: ISSUE-003 — Name and Description lost their required marker (asterisk and
// aria-required) when blank-only validation replaced required().
// Found by /qa on 2026-09-28
// Report: .gstack/qa-reports/qa-report-localhost-2026-09-28.md
import { TestBed } from '@angular/core/testing';
import { GalleryStore } from '../gallery.store';
import { GalleryForm } from './gallery-form';

describe('GalleryForm required markers', () => {
  it('should mark every required text and number field as required', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: GalleryStore, useValue: {} }] });
    const fixture = TestBed.createComponent(GalleryForm);
    fixture.componentRef.setInput('storageKey', 'key-1');
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    const name = element.querySelector('input:not([type])');
    const description = element.querySelector('textarea');
    for (const field of [name, description]) {
      expect(
        field?.hasAttribute('required') || field?.getAttribute('aria-required') === 'true',
      ).toBe(true);
    }
    // Material draws an asterisk on each required field: name, description, style, created,
    // height, width and depth. Weight is optional.
    expect(element.querySelectorAll('.mat-mdc-form-field-required-marker').length).toBe(7);
  });
});
