import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GalleryDocument } from 'core';
import { galleryItem } from '../gallery.testing';
import { GalleryGrid } from './gallery-grid';

describe('GalleryGrid', () => {
  let fixture: ComponentFixture<GalleryGrid>;
  let element: HTMLElement;

  async function render(
    items: GalleryDocument[],
    state: { loading?: boolean; error?: string | null } = {},
  ) {
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('loading', state.loading ?? false);
    fixture.componentRef.setInput('error', state.error ?? null);
    await fixture.whenStable();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(GalleryGrid);
    element = fixture.nativeElement;
  });

  it('should link each item to its detail page, with its cover, name and year', async () => {
    await render([galleryItem(), galleryItem({ id: 'heron', name: 'Heron', imageUrls: [] })]);

    const cards = element.querySelectorAll<HTMLAnchorElement>('a.card');
    expect(cards.length).toBe(2);
    expect(cards[0].getAttribute('href')).toBe('/mustang');
    expect(cards[0].querySelector('.name')?.textContent).toBe('Mustang at Dawn');
    expect(cards[0].querySelector('.year')?.textContent).toBe('2024');
    expect(cards[0].querySelector('img')?.getAttribute('src')).toBe(
      'https://example.test/mustang-1.jpg',
    );
    // An item without photos still gets its mat, just empty.
    expect(cards[1].querySelector('img')).toBeNull();
  });

  it('should load the first 8 covers eagerly at high priority and lazy-load the rest', async () => {
    await render(
      Array.from({ length: 10 }, (_, i) =>
        galleryItem({ id: `item-${i}`, imageUrls: [`https://example.test/${i}.jpg`] }),
      ),
    );

    const images = Array.from(element.querySelectorAll('img'));
    expect(images.map((img) => img.getAttribute('fetchpriority'))).toEqual([
      ...Array(8).fill('high'),
      'auto',
      'auto',
    ]);
    expect(images.map((img) => img.getAttribute('loading'))).toEqual([
      ...Array(8).fill('eager'),
      'lazy',
      'lazy',
    ]);
  });

  it('should say so when there is nothing to show', async () => {
    await render([]);
    expect(element.textContent).toContain('Nothing here yet');
  });

  it('should show loading, then errors, instead of the grid', async () => {
    await render([], { loading: true });
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Loading');

    await render([galleryItem()], { error: 'Failed.' });
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Failed.');
    expect(element.querySelector('a.card')).toBeNull();
  });
});
