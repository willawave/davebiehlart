import { Service, inject } from '@angular/core';
import { ScheduleDocument } from 'core';
import { FIRESTORE } from 'core/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { FirestoreTransferCache } from '../shared/firestore-transfer-cache';

const COLLECTION = 'schedule';

// Read-only. The read goes through FirestoreTransferCache, so the browser reuses what the
// server rendered instead of reading Firestore again during hydration.
@Service()
export class ScheduleService {
  private readonly firestore = inject(FIRESTORE);
  private readonly cache = inject(FirestoreTransferCache);

  // The gallery's weekly hours: the collection's only document (the first by ID, as the
  // admin app and the legacy site read it). Null while none has been saved.
  getSchedule(): ScheduleDocument | null | Promise<ScheduleDocument | null> {
    return this.cache.read('schedule', async () => {
      const snapshot = await getDocs(query(collection(this.firestore, COLLECTION), limit(1)));
      const first = snapshot.docs[0];
      return first ? { ...(first.data() as ScheduleDocument), id: first.id } : null;
    });
  }
}
