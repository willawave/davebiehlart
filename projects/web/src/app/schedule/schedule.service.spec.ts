import { TestBed } from '@angular/core/testing';
import { FIRESTORE } from 'core/firebase';
import { type Firestore } from 'firebase/firestore';
import { FirestoreTransferCache } from '../shared/firestore-transfer-cache';
import { ScheduleService } from './schedule.service';
import { studioSchedule } from './schedule.testing';

// The Firestore query needs a real SDK instance; the E2E suite runs it against the emulators.
describe('ScheduleService', () => {
  const cache = { read: vi.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: FIRESTORE, useValue: {} as Firestore },
        { provide: FirestoreTransferCache, useValue: cache },
      ],
    });
  });

  it('should read the schedule through the transfer cache', () => {
    const schedule = studioSchedule();
    cache.read.mockReturnValue(schedule);

    expect(TestBed.inject(ScheduleService).getSchedule()).toBe(schedule);
    expect(cache.read).toHaveBeenCalledWith('schedule', expect.any(Function));
  });
});
