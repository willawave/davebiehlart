import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { GalleryStyle } from 'core';
import { GalleryStore } from '../gallery.store';
import { galleryItem } from '../gallery.testing';
import { BronzeList } from './bronze-list';

describe('BronzeList', () => {
  const store = {
    visibleGalleryItems: signal([galleryItem()]),
    loading: signal(false),
    error: signal<string | null>(null),
    loadVisible: vi.fn(() => Promise.resolve()),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: GalleryStore, useValue: store }],
    });
  });

  it('should load and list the visible bronzes', async () => {
    const fixture = TestBed.createComponent(BronzeList);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    expect(store.loadVisible).toHaveBeenCalledWith(GalleryStyle.BRONZE);
    expect(element.querySelector('h1')?.textContent).toBe('Bronzes');
    expect(element.querySelectorAll('a.card').length).toBe(1);
  });

  it('should set its fixed description and share tags', () => {
    TestBed.createComponent(BronzeList);
    const meta = TestBed.inject(Meta);
    expect(meta.getTag("name='description'")?.content).toBe(
      'Bronze sculptures by artist Dave Biehl.',
    );
    expect(meta.getTag("property='og:url'")?.content).toBe('https://davebiehlart.com/bronzes');
  });
});
