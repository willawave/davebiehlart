import { PendingTasks, inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { MediaDocument } from 'core';
import { MediaService } from './media.service';

interface MediaState {
  // Visible videos and articles, newest first.
  visibleMediaItems: MediaDocument[];
  selectedMediaItem: MediaDocument | null;
  loading: boolean;
  error: string | null;
}

const initialState: MediaState = {
  visibleMediaItems: [],
  selectedMediaItem: null,
  loading: false,
  error: null,
};

export const MediaStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, service = inject(MediaService), pendingTasks = inject(PendingTasks)) => {
    // The detail route's title and data resolvers both ask for the same item at once.
    let pendingItem: { id: string; result: Promise<MediaDocument | null> } | undefined;
    // A list load that a newer one replaced must not land over it.
    let latestList = 0;
    // Likewise, a detail page left mid-load must not replace the next item's selection.
    let latestItem = 0;

    return {
      // Server rendering waits for the pending task. A transfer-state hit is applied
      // synchronously, so hydration renders the same list the server did.
      async loadVisible(): Promise<void> {
        const id = ++latestList;
        const result = service.getVisible();
        if (!(result instanceof Promise)) {
          patchState(store, { visibleMediaItems: result, loading: false, error: null });
          return;
        }
        patchState(store, { visibleMediaItems: [], loading: true, error: null });
        const done = pendingTasks.add();
        try {
          const items = await result;
          if (id === latestList) patchState(store, { visibleMediaItems: items, loading: false });
        } catch {
          if (id === latestList) {
            patchState(store, {
              loading: false,
              error: 'The media could not be loaded. Please try again later.',
            });
          }
        } finally {
          done();
        }
      },

      // Resolves to the item, or null if it is missing, hidden, or failed to load.
      loadSelected(id: string): Promise<MediaDocument | null> {
        if (pendingItem?.id === id) {
          return pendingItem.result;
        }
        const request = ++latestItem;
        const result = (async () => {
          try {
            const item = await service.getVisibleById(id);
            if (request === latestItem) {
              patchState(store, { selectedMediaItem: item, error: null });
            }
            return item;
          } catch {
            if (request === latestItem) patchState(store, { selectedMediaItem: null });
            return null;
          } finally {
            if (pendingItem?.id === id) pendingItem = undefined;
          }
        })();
        pendingItem = { id, result };
        return result;
      },
    };
  }),
);
