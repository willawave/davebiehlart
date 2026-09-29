import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { GalleryDocument, GalleryStyle } from 'core';
import { GalleryItem } from '../gallery-item/gallery-item';
import { GalleryNeighbors, GalleryStore } from '../gallery.store';
import { galleryItem } from '../gallery.testing';
import { GlassDetail } from './glass-detail';

describe('GlassDetail', () => {
  const selectedGalleryItem = signal<GalleryDocument | null>(null);
  const neighbors = signal<GalleryNeighbors>({ previous: null, next: null });

  beforeEach(() => {
    neighbors.set({ previous: null, next: null });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: GalleryStore, useValue: { selectedGalleryItem, neighbors } },
      ],
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

  it('should pass the neighboring pieces to the pager', async () => {
    const previous = galleryItem({ id: 'newer', style: GalleryStyle.GLASS });
    selectedGalleryItem.set(galleryItem({ style: GalleryStyle.GLASS }));
    neighbors.set({ previous, next: null });
    const fixture = TestBed.createComponent(GlassDetail);
    await fixture.whenStable();

    const item = fixture.debugElement.query(By.directive(GalleryItem))
      .componentInstance as GalleryItem;
    expect(item.previous()).toBe(previous);
    expect(item.next()).toBeNull();
    expect(item.sectionLabel()).toBe('kiln glass');
  });

  it('should render nothing without an item', async () => {
    selectedGalleryItem.set(null);
    const fixture = TestBed.createComponent(GlassDetail);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-gallery-item')).toBeNull();
  });
});
