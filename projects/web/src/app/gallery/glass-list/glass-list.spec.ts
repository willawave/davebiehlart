import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { GalleryStyle } from 'core';
import { GalleryStore } from '../gallery.store';
import { galleryItem } from '../gallery.testing';
import { GlassList } from './glass-list';

describe('GlassList', () => {
  const store = {
    visibleGalleryItems: signal([galleryItem({ style: GalleryStyle.GLASS })]),
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

  it('should load and list the visible kiln glass', async () => {
    const fixture = TestBed.createComponent(GlassList);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    expect(store.loadVisible).toHaveBeenCalledWith(GalleryStyle.GLASS);
    expect(element.querySelector('h1')?.textContent).toBe('Kiln Glass');
    expect(element.querySelectorAll('a.card').length).toBe(1);
  });

  it('should set its fixed description and share tags', () => {
    TestBed.createComponent(GlassList);
    const meta = TestBed.inject(Meta);
    expect(meta.getTag("name='description'")?.content).toBe('Kiln glass by artist Dave Biehl.');
    expect(meta.getTag("property='og:url'")?.content).toBe('https://davebiehlart.com/glass');
  });
});
