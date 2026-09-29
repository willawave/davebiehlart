import { TestBed } from '@angular/core/testing';
import { FIRESTORE } from 'core/firebase';
import { Timestamp, type Firestore } from 'firebase/firestore';
import { FirestoreTransferCache } from '../shared/firestore-transfer-cache';
import { MediaService, showable } from './media.service';
import { articleItem, videoItem } from './media.testing';

// The Firestore queries need a real SDK instance; the E2E suite runs them against the
// emulators (and the list rule in tests/rules/ checks the `visible == true` filter).
describe('MediaService', () => {
  let service: MediaService;
  const cache = { read: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: FIRESTORE, useValue: {} as Firestore },
        { provide: FirestoreTransferCache, useValue: cache },
      ],
    });
    service = TestBed.inject(MediaService);
  });

  it('should cache the list and each item under its own transfer-state key', () => {
    const items = [videoItem()];
    cache.read.mockReturnValue(items);

    expect(service.getVisible()).toBe(items);
    service.getVisibleById('on-air');

    expect(cache.read.mock.calls.map(([key]) => key)).toEqual([
      'media:visible',
      'media:item:on-air',
    ]);
  });
});

describe('showable', () => {
  const on = (iso: string) => Timestamp.fromDate(new Date(iso));

  it('should drop links the site cannot show and sort the rest newest first', () => {
    const older = articleItem({ id: 'older', date: on('2025-01-01T12:00:00Z') });
    const newer = videoItem({ id: 'newer', date: on('2026-09-01T12:00:00Z') });
    const channel = videoItem({ id: 'channel', link: 'https://www.youtube.com/@davebiehl' });
    const junk = articleItem({ id: 'junk', link: 'not a link' });

    expect(showable([older, channel, newer, junk]).map((item) => item.id)).toEqual([
      'newer',
      'older',
    ]);
  });
});
