import { TestBed } from '@angular/core/testing';
import { FIRESTORE_LITE } from 'core/firebase';
import { Timestamp, type Firestore } from 'firebase/firestore/lite';
import { FirestoreTransferCache } from '../shared/firestore-transfer-cache';
import { EventService, upcomingOnly } from './event.service';
import { eventItem } from './event.testing';

// The Firestore queries need a real SDK instance; the E2E suite runs them against the
// emulators (and the list rule in tests/rules/ checks the `visible == true` filter).
describe('EventService', () => {
  let service: EventService;
  const cache = { read: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: FIRESTORE_LITE, useValue: {} as Firestore },
        { provide: FirestoreTransferCache, useValue: cache },
      ],
    });
    service = TestBed.inject(EventService);
  });

  it('should cache the list and each event under its own transfer-state key', () => {
    const events = [eventItem()];
    cache.read.mockReturnValue(events);

    expect(service.getUpcoming()).toBe(events);
    service.getVisibleById('open-studio');

    expect(cache.read.mock.calls.map(([key]) => key)).toEqual([
      'event:upcoming',
      'event:item:open-studio',
    ]);
  });
});

describe('upcomingOnly', () => {
  const on = (iso: string, time: string, id: string) =>
    eventItem({ id, time, date: Timestamp.fromDate(new Date(iso)) });

  it('should drop past events and sort the rest soonest first', () => {
    const past = on('2026-09-01T05:00:00Z', '10:00', 'past');
    const today = on('2026-09-29T05:00:00Z', '19:00', 'today');
    const later = on('2026-11-01T05:00:00Z', '09:00', 'later');
    const earlierToday = on('2026-09-29T05:00:00Z', '09:00', 'earlier-today');

    const result = upcomingOnly(
      [later, past, today, earlierToday],
      Date.parse('2026-09-29T20:00Z'),
    );

    expect(result.map((item) => item.id)).toEqual(['earlier-today', 'today', 'later']);
  });
});
