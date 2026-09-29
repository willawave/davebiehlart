import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MediaDocument } from 'core';
import { MediaStore } from '../media.store';
import { articleItem, videoItem } from '../media.testing';
import { MediaDetail } from './media-detail';

const text = (element: Element | null | undefined) =>
  element?.textContent?.replace(/\s+/g, ' ').trim();

describe('MediaDetail', () => {
  const store = { selectedMediaItem: signal<MediaDocument | null>(null) };

  async function render(item: MediaDocument) {
    store.selectedMediaItem.set(item);
    TestBed.configureTestingModule({ providers: [{ provide: MediaStore, useValue: store }] });
    const fixture = TestBed.createComponent(MediaDetail);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('should play a video from YouTube without cookies', async () => {
    const element = await render(videoItem());

    expect(text(element.querySelector('h1'))).toBe('On Air at the Foundry');
    expect(text(element.querySelector('.kicker'))).toBe('Video · September 12, 2026');
    const iframe = element.querySelector('iframe');
    expect(iframe?.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(iframe?.getAttribute('title')).toBe('On Air at the Foundry (YouTube video)');
    expect(text(element.querySelector('.description'))).toBe(
      'A visit to the foundry for the evening news.',
    );
    expect(element.querySelector('a.link')).toBeNull();
  });

  it('should summarize an article and link to it in a new tab', async () => {
    const element = await render(articleItem());

    expect(text(element.querySelector('.kicker'))).toBe('Article · example.com · June 3, 2026');
    expect(element.querySelector('iframe')).toBeNull();
    const link = element.querySelector('a.link');
    expect(link?.getAttribute('href')).toBe('https://www.example.com/arts/sculptor-profile');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(text(link)).toContain('Read on example.com');
    expect(text(link?.querySelector('.visually-hidden'))).toBe('(opens in a new tab)');
  });
});
