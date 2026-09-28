import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GalleryDocument, GalleryStyle } from 'core';
import { GalleryStore } from '../gallery.store';
import { galleryItem } from '../gallery.testing';
import { GlassDetail } from './glass-detail';

describe('GlassDetail', () => {
  const selectedGalleryItem = signal<GalleryDocument | null>(null);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: GalleryStore, useValue: { selectedGalleryItem } }],
    });
  });

  it('should show the resolved kiln glass', async () => {
    selectedGalleryItem.set(galleryItem({ name: 'Amber Bowl', style: GalleryStyle.GLASS }));
    const fixture = TestBed.createComponent(GlassDetail);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('h1')?.textContent).toBe('Amber Bowl');
    expect(element.querySelector('.kicker')?.textContent).toContain('Kiln glass');
  });

  it('should render nothing without an item', async () => {
    selectedGalleryItem.set(null);
    const fixture = TestBed.createComponent(GlassDetail);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-gallery-item')).toBeNull();
  });
});
