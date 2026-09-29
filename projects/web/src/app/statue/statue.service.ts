import { Service, inject } from '@angular/core';
import { StatueDocument } from 'core';
import { FIRESTORE } from 'core/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { FirestoreTransferCache } from '../shared/firestore-transfer-cache';

// Singular, as in production.
const COLLECTION = 'statue';

function recentFirst(a: StatueDocument, b: StatueDocument): number {
  return b.dedicated.toMillis() - a.dedicated.toMillis();
}

// Read-only. Both reads go through FirestoreTransferCache, so the browser reuses what the
// server rendered instead of reading Firestore again during hydration.
@Service()
export class StatueService {
  private readonly firestore = inject(FIRESTORE);
  private readonly cache = inject(FirestoreTransferCache);

  // An equality filter only, sorted here: Firestore serves it without a composite index,
  // and production's indexes are not tracked in this repo. `visible == true` is required
  // by the list rule in firestore.rules.
  getVisible(): StatueDocument[] | Promise<StatueDocument[]> {
    return this.cache.read('statue:all', async () => {
      const snapshot = await getDocs(
        query(collection(this.firestore, COLLECTION), where('visible', '==', true)),
      );
      return snapshot.docs
        .map((item) => ({ ...(item.data() as StatueDocument), id: item.id }))
        .sort(recentFirst);
    });
  }

  // Null for a missing or hidden statue. Hidden statues are readable by ID, so they are
  // dropped here, before the result can reach the page or the transfer state.
  getVisibleById(id: string): StatueDocument | null | Promise<StatueDocument | null> {
    return this.cache.read(`statue:item:${id}`, async () => {
      const snapshot = await getDoc(doc(this.firestore, COLLECTION, id));
      const data = snapshot.data() as StatueDocument | undefined;
      return data?.visible === true ? { ...data, id: snapshot.id } : null;
    });
  }
}
