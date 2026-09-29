import { Service, inject } from '@angular/core';
import { EventDocument, byEventStart, isUpcoming } from 'core';
import { FIRESTORE } from 'core/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { FirestoreTransferCache } from '../shared/firestore-transfer-cache';

// Singular, as in production.
const COLLECTION = 'event';

// The events still to come (the current day included), soonest first.
export function upcomingOnly(items: EventDocument[], now: number): EventDocument[] {
  return items.filter((item) => isUpcoming(item, now)).sort(byEventStart);
}

// Read-only. Both reads go through FirestoreTransferCache, so the browser reuses what the
// server rendered instead of reading Firestore again during hydration.
@Service()
export class EventService {
  private readonly firestore = inject(FIRESTORE);
  private readonly cache = inject(FirestoreTransferCache);

  // An equality filter only, with past events dropped and the rest sorted here: Firestore
  // serves it without a composite index, and production's indexes are not tracked in this
  // repo. `visible == true` is required by the list rule in firestore.rules.
  getUpcoming(): EventDocument[] | Promise<EventDocument[]> {
    return this.cache.read('event:upcoming', async () => {
      const snapshot = await getDocs(
        query(collection(this.firestore, COLLECTION), where('visible', '==', true)),
      );
      const items = snapshot.docs.map((item) => ({
        ...(item.data() as EventDocument),
        id: item.id,
      }));
      return upcomingOnly(items, Date.now());
    });
  }

  // Null for a missing or hidden event. Hidden events are readable by ID, so they are
  // dropped here, before the result can reach the page or the transfer state. Past events
  // are kept: their pages say the event has ended.
  getVisibleById(id: string): EventDocument | null | Promise<EventDocument | null> {
    return this.cache.read(`event:item:${id}`, async () => {
      const snapshot = await getDoc(doc(this.firestore, COLLECTION, id));
      const data = snapshot.data() as EventDocument | undefined;
      return data?.visible === true ? { ...data, id: snapshot.id } : null;
    });
  }
}
