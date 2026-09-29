// Regression: ISSUE-001 — a video still above the fold was the page's LCP element without
// "priority", so NgOptimizedImage logged NG02955 on every phone visit to /media.
// Found by /qa on 2026-09-29
// Report: .gstack/qa-reports/run-20260929T185346Z/qa-report-localhost-2026-09-29.md
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MediaDocument } from 'core';
import { MediaStore } from '../media.store';
import { articleItem, videoItem } from '../media.testing';
import { MediaList } from './media-list';

describe('MediaList above-the-fold stills', () => {
  it('should load the stills a phone shows first eagerly, and the rest lazily', async () => {
    const items: MediaDocument[] = [
      videoItem({ id: 'v1' }),
      articleItem({ id: 'a1' }),
      ...Array.from({ length: 6 }, (_, i) => videoItem({ id: `v${i + 2}` })),
    ];
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: MediaStore,
          useValue: {
            visibleMediaItems: signal(items),
            loading: signal(false),
            error: signal(null),
            loadVisible: () => Promise.resolve(),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(MediaList);
    await fixture.whenStable();

    const rows = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a.row'));
    const priority = rows.map((row) => row.querySelector('img')?.getAttribute('fetchpriority'));
    // Rows 1-6 fill a phone screen; row 2 is an article, with no image.
    expect(priority).toEqual(['high', undefined, 'high', 'high', 'high', 'high', 'auto', 'auto']);
  });
});
