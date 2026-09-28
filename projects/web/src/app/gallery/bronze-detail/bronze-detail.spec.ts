import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GalleryDocument } from 'core';
import { GalleryStore } from '../gallery.store';
import { galleryItem } from '../gallery.testing';
import { BronzeDetail } from './bronze-detail';

describe('BronzeDetail', () => {
  const selectedGalleryItem = signal<GalleryDocument | null>(null);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: GalleryStore, useValue: { selectedGalleryItem } }],
    });
  });

  it('should show the resolved bronze', async () => {
    selectedGalleryItem.set(galleryItem());
    const fixture = TestBed.createComponent(BronzeDetail);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('h1')?.textContent).toBe('Mustang at Dawn');
    expect(element.querySelector('.kicker')?.textContent).toContain('Bronze');
  });

  it('should render nothing without an item', async () => {
    selectedGalleryItem.set(null);
    const fixture = TestBed.createComponent(BronzeDetail);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-gallery-item')).toBeNull();
  });
});
