import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { MediaDocument } from 'core';
import { MediaStore } from '../media.store';
import { articleItem, videoItem } from '../media.testing';
import { MediaList } from './media-list';

const text = (element: Element | null | undefined) =>
  element?.textContent?.replace(/\s+/g, ' ').trim();

describe('MediaList', () => {
  const store = {
    visibleMediaItems: signal<MediaDocument[]>([]),
    loading: signal(false),
    error: signal<string | null>(null),
    loadVisible: vi.fn(() => Promise.resolve()),
  };

  async function render() {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: MediaStore, useValue: store }],
    });
    const fixture = TestBed.createComponent(MediaList);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    store.visibleMediaItems.set([]);
    store.loading.set(false);
    store.error.set(null);
  });

  it('should load the items and describe the page', async () => {
    await render();
    expect(store.loadVisible).toHaveBeenCalled();
    expect(TestBed.inject(Meta).getTag("name='description'")?.content).toBe(
      'Videos and press coverage of sculptor Dave Biehl and his bronze work.',
    );
  });

  it('should list a video with its still and an article with its site, each linking to its page', async () => {
    store.visibleMediaItems.set([videoItem(), articleItem()]);
    const { element } = await render();

    const rows = element.querySelectorAll<HTMLAnchorElement>('.media a.row');
    expect(rows.length).toBe(2);

    expect(rows[0].getAttribute('href')).toBe('/on-air');
    expect(rows[0].querySelector('.still img')?.getAttribute('src')).toBe(
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    );
    expect(text(rows[0].querySelector('.title'))).toBe('On Air at the Foundry');
    expect(text(rows[0].querySelector('.meta'))).toBe('Video · September 12, 2026');

    expect(rows[1].getAttribute('href')).toBe('/profile');
    expect(rows[1].querySelector('img')).toBeNull();
    expect(text(rows[1].querySelector('.tile .site'))).toBe('example.com');
    expect(text(rows[1].querySelector('.meta'))).toBe('Article · example.com · June 3, 2026');
  });

  it('should show the skeleton while loading, and errors', async () => {
    store.loading.set(true);
    const { fixture, element } = await render();
    expect(element.querySelector('app-media-list-skeleton [role="status"]')).not.toBeNull();

    store.error.set('The media could not be loaded. Please try again later.');
    await fixture.whenStable();
    expect(text(element.querySelector('[role="alert"]'))).toContain('could not be loaded');
  });

  it('should say when there is nothing yet, and point to the contact page', async () => {
    const { element } = await render();
    expect(text(element.querySelector('.empty'))).toContain('No videos or articles yet.');
    expect(element.querySelector('.empty a')?.getAttribute('href')).toBe('/contact');
  });
});
