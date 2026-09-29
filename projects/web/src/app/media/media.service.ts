import { Service, inject } from '@angular/core';
import { MediaDocument, parseMediaLink } from 'core';
import { FIRESTORE } from 'core/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { FirestoreTransferCache } from '../shared/firestore-transfer-cache';

const COLLECTION = 'media';

// The items the site can show, newest first. A link that is neither a YouTube video nor a
// web address (an old hand-entered one) is dropped rather than shown broken.
export function showable(items: MediaDocument[]): MediaDocument[] {
  return items
    .filter((item) => parseMediaLink(item.link))
    .sort((a, b) => b.date.toMillis() - a.date.toMillis());
}

// Read-only. Both reads go through FirestoreTransferCache, so the browser reuses what the
// server rendered instead of reading Firestore again during hydration.
@Service()
export class MediaService {
  private readonly firestore = inject(FIRESTORE);
  private readonly cache = inject(FirestoreTransferCache);

  // An equality filter only, sorted here: Firestore serves it without a composite index,
  // and production's indexes are not tracked in this repo. `visible == true` is required
  // by the list rule in firestore.rules.
  getVisible(): MediaDocument[] | Promise<MediaDocument[]> {
    return this.cache.read('media:visible', async () => {
      const snapshot = await getDocs(
        query(collection(this.firestore, COLLECTION), where('visible', '==', true)),
      );
      return showable(
        snapshot.docs.map((item) => ({ ...(item.data() as MediaDocument), id: item.id })),
      );
    });
  }

  // Null for a missing, hidden or unshowable item. Hidden items are readable by ID, so they
  // are dropped here, before the result can reach the page or the transfer state.
  getVisibleById(id: string): MediaDocument | null | Promise<MediaDocument | null> {
    return this.cache.read(`media:item:${id}`, async () => {
      const snapshot = await getDoc(doc(this.firestore, COLLECTION, id));
      const data = snapshot.data() as MediaDocument | undefined;
      return data?.visible === true && parseMediaLink(data.link)
        ? { ...data, id: snapshot.id }
        : null;
    });
  }
}
