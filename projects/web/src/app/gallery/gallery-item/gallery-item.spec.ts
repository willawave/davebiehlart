import { ComponentFixture, TestBed } from '@angular/core/testing';
import { galleryItem } from '../gallery.testing';
import { GalleryItem } from './gallery-item';

describe('GalleryItem', () => {
  let fixture: ComponentFixture<GalleryItem>;
  let element: HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(GalleryItem);
    element = fixture.nativeElement;
    fixture.componentRef.setInput('kind', 'Bronze');
  });

  function dimensions(): string[] {
    return Array.from(element.querySelectorAll('dt'), (dt) =>
      `${dt.textContent}: ${dt.nextElementSibling?.textContent}`.trim(),
    );
  }

  it('should show the name, date line, description, photos and dimensions', async () => {
    fixture.componentRef.setInput('item', galleryItem());
    await fixture.whenStable();

    expect(element.querySelector('h1')?.textContent).toBe('Mustang at Dawn');
    expect(element.querySelector('.kicker')?.textContent?.trim()).toBe(
      'Bronze · Created March 2024',
    );
    expect(element.querySelector('.description')?.textContent).toBe(
      'Cast bronze on a walnut base.',
    );
    expect(element.querySelectorAll('app-image-track img').length).toBe(2);
    expect(dimensions()).toEqual([
      'Height: 18 in',
      'Width: 22 in',
      'Depth: 9 in',
      'Weight: 34 lbs',
    ]);
  });

  it('should leave out an empty description, no photos, and no weight', async () => {
    fixture.componentRef.setInput(
      'item',
      galleryItem({ description: '', imageUrls: [], weight: null }),
    );
    await fixture.whenStable();

    expect(element.querySelector('.description')).toBeNull();
    expect(element.querySelector('app-image-track')).toBeNull();
    expect(dimensions()).not.toContain('Weight: null lbs');
    expect(element.querySelectorAll('dt').length).toBe(3);
  });
});
