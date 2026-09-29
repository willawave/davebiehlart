import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { GalleryDocument } from 'core';
import { GalleryItem } from '../gallery-item/gallery-item';
import { GalleryNeighbors, GalleryStore } from '../gallery.store';
import { galleryItem } from '../gallery.testing';
import { BronzeDetail } from './bronze-detail';

describe('BronzeDetail', () => {
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

  it('should show the resolved bronze', async () => {
    selectedGalleryItem.set(galleryItem());
    const fixture = TestBed.createComponent(BronzeDetail);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('h1')?.textContent).toBe('Mustang at Dawn');
    expect(element.querySelector('.kicker')?.textContent).toContain('Bronze');
  });

  it('should pass the neighboring bronzes to the pager', async () => {
    const previous = galleryItem({ id: 'newer' });
    const next = galleryItem({ id: 'older' });
    selectedGalleryItem.set(galleryItem());
    neighbors.set({ previous, next });
    const fixture = TestBed.createComponent(BronzeDetail);
    await fixture.whenStable();

    const item = fixture.debugElement.query(By.directive(GalleryItem))
      .componentInstance as GalleryItem;
    expect(item.previous()).toBe(previous);
    expect(item.next()).toBe(next);
    expect(item.sectionLabel()).toBe('bronzes');
  });

  it('should render nothing without an item', async () => {
    selectedGalleryItem.set(null);
    const fixture = TestBed.createComponent(BronzeDetail);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-gallery-item')).toBeNull();
  });
});
