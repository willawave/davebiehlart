import { TestBed } from '@angular/core/testing';
import { FIRESTORE } from 'core/firebase';
import type { Firestore } from 'firebase/firestore';
import { FirestoreTransferCache } from '../shared/firestore-transfer-cache';
import { StatueService } from './statue.service';
import { statueItem } from './statue.testing';

// The Firestore queries need a real SDK instance; the E2E suite runs them against the
// emulators (and the list rule in tests/rules/ checks the `visible == true` filter).
describe('StatueService', () => {
  let service: StatueService;
  const cache = { read: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: FIRESTORE, useValue: {} as Firestore },
        { provide: FirestoreTransferCache, useValue: cache },
      ],
    });
    service = TestBed.inject(StatueService);
  });

  it('should cache the list and each statue under its own transfer-state key', () => {
    const statues = [statueItem()];
    cache.read.mockReturnValue(statues);

    expect(service.getVisible()).toBe(statues);
    service.getVisibleById('pioneer');

    expect(cache.read.mock.calls.map(([key]) => key)).toEqual([
      'statue:all',
      'statue:item:pioneer',
    ]);
  });
});
