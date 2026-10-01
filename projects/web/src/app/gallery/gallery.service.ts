import { Service, inject } from '@angular/core';
import { GalleryDocument, GalleryStyle } from 'core';
import { FIRESTORE_LITE } from 'core/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore/lite';
import { FirestoreTransferCache } from '../shared/firestore-transfer-cache';

const COLLECTION = 'gallery';

function newestFirst(a: GalleryDocument, b: GalleryDocument): number {
  return b.created.toMillis() - a.created.toMillis();
}

// Read-only. Both reads go through FirestoreTransferCache, so the browser reuses what the
// server rendered instead of reading Firestore again during hydration.
@Service()
export class GalleryService {
  private readonly firestore = inject(FIRESTORE_LITE);
  private readonly cache = inject(FirestoreTransferCache);

  // Equality filters only, sorted here: Firestore serves them without a composite index,
  // and production's indexes are not tracked in this repo. `visible == true` is required
  // by the list rule in firestore.rules.
  getVisible(style: GalleryStyle): GalleryDocument[] | Promise<GalleryDocument[]> {
    return this.cache.read(`gallery:${style}`, async () => {
      const snapshot = await getDocs(
        query(
          collection(this.firestore, COLLECTION),
          where('visible', '==', true),
          where('style', '==', style),
        ),
      );
      return snapshot.docs
        .map((item) => ({ ...(item.data() as GalleryDocument), id: item.id }))
        .sort(newestFirst);
    });
  }

  // Null for a missing or hidden item. Hidden items are readable by ID, so they are dropped
  // here, before the result can reach the page or the transfer state.
  getVisibleById(id: string): GalleryDocument | null | Promise<GalleryDocument | null> {
    return this.cache.read(`gallery:item:${id}`, async () => {
      const snapshot = await getDoc(doc(this.firestore, COLLECTION, id));
      const data = snapshot.data() as GalleryDocument | undefined;
      return data?.visible === true ? { ...data, id: snapshot.id } : null;
    });
  }
}
