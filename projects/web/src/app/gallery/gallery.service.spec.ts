import { TestBed } from '@angular/core/testing';
import { GalleryStyle } from 'core';
import { FIRESTORE_LITE } from 'core/firebase';
import type { Firestore } from 'firebase/firestore/lite';
import { FirestoreTransferCache } from '../shared/firestore-transfer-cache';
import { GalleryService } from './gallery.service';
import { galleryItem } from './gallery.testing';

// The Firestore queries need a real SDK instance; the E2E suite runs them against the
// emulators (and the list rule in tests/rules/ checks the `visible == true` filter).
describe('GalleryService', () => {
  let service: GalleryService;
  const cache = { read: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: FIRESTORE_LITE, useValue: {} as Firestore },
        { provide: FirestoreTransferCache, useValue: cache },
      ],
    });
    service = TestBed.inject(GalleryService);
  });

  it('should cache each style and each item under its own transfer-state key', () => {
    const bronzes = [galleryItem()];
    cache.read.mockReturnValue(bronzes);

    expect(service.getVisible(GalleryStyle.BRONZE)).toBe(bronzes);
    service.getVisible(GalleryStyle.GLASS);
    service.getVisibleById('mustang');

    expect(cache.read.mock.calls.map(([key]) => key)).toEqual([
      'gallery:Bronze',
      'gallery:Glass',
      'gallery:item:mustang',
    ]);
  });
});
