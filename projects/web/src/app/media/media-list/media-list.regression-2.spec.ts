// Regression: ISSUE-003 — a long site name broke mid-word in its tile ("news.example.or / g").
// Regression: ISSUE-004 — a row's date split across lines on a phone ("August / 3, 2026").
// Found by /qa on 2026-09-29
// Report: .gstack/qa-reports/run-20260929T185346Z/qa-report-localhost-2026-09-29.md
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MediaStore } from '../media.store';
import { articleItem } from '../media.testing';
import { MediaList } from './media-list';

describe('MediaList line breaks', () => {
  async function render() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: MediaStore,
          useValue: {
            visibleMediaItems: signal([
              articleItem({ link: 'https://magazine.example.com/issue-42/art' }),
            ]),
            loading: signal(false),
            error: signal(null),
            loadVisible: () => Promise.resolve(),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(MediaList);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it("should let a tile's site name wrap only after a dot", async () => {
    const site = (await render()).querySelector('.tile .site');
    expect(site?.textContent).toBe('magazine.example.com');
    const parts = Array.from(site?.children ?? [], (el) => el.textContent || el.tagName);
    expect(parts).toEqual(['magazine.', 'WBR', 'example.', 'WBR', 'com']);
  });

  it('should keep the date on one line', async () => {
    const date = (await render()).querySelector('.meta .date');
    expect(date?.textContent).toBe('June 3, 2026');
  });
});
