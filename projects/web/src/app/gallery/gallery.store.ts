import { PendingTasks, inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { GalleryDocument, GalleryStyle } from 'core';
import { GalleryService } from './gallery.service';

interface GalleryState {
  visibleGalleryItems: GalleryDocument[];
  selectedGalleryItem: GalleryDocument | null;
  loading: boolean;
  error: string | null;
}

const initialState: GalleryState = {
  visibleGalleryItems: [],
  selectedGalleryItem: null,
  loading: false,
  error: null,
};

export const GalleryStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, service = inject(GalleryService), pendingTasks = inject(PendingTasks)) => {
    // The detail route's title and data resolvers both ask for the same item at once.
    let pendingItem: { key: string; result: Promise<GalleryDocument | null> } | undefined;
    // Leaving /bronzes for /glass mid-load must not let the bronzes land under Kiln Glass.
    let latestList = 0;
    // Likewise, a detail page left mid-load must not replace the next item's selection.
    let latestItem = 0;

    return {
      // Server rendering waits for the pending task. A transfer-state hit is applied
      // synchronously, so hydration renders the same list the server did.
      async loadVisible(style: GalleryStyle): Promise<void> {
        const id = ++latestList;
        const result = service.getVisible(style);
        if (!(result instanceof Promise)) {
          patchState(store, { visibleGalleryItems: result, loading: false, error: null });
          return;
        }
        patchState(store, { visibleGalleryItems: [], loading: true, error: null });
        const done = pendingTasks.add();
        try {
          const items = await result;
          if (id === latestList) patchState(store, { visibleGalleryItems: items, loading: false });
        } catch {
          if (id === latestList) {
            patchState(store, {
              loading: false,
              error: 'The gallery could not be loaded. Please try again later.',
            });
          }
        } finally {
          done();
        }
      },

      // Resolves to the item, or null if it is missing, hidden, not this style, or failed
      // to load.
      loadSelected(id: string, style: GalleryStyle): Promise<GalleryDocument | null> {
        const key = `${style}/${id}`;
        if (pendingItem?.key === key) {
          return pendingItem.result;
        }
        const request = ++latestItem;
        const result = (async () => {
          try {
            const item = await service.getVisibleById(id);
            const selected = item?.style === style ? item : null;
            if (request === latestItem) {
              patchState(store, { selectedGalleryItem: selected, error: null });
            }
            return selected;
          } catch {
            if (request === latestItem) patchState(store, { selectedGalleryItem: null });
            return null;
          } finally {
            if (pendingItem?.key === key) pendingItem = undefined;
          }
        })();
        pendingItem = { key, result };
        return result;
      },
    };
  }),
);
