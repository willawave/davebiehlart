import { PendingTasks, computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { StatueDocument } from 'core';
import { StatueService } from './statue.service';

interface StatueState {
  visibleStatueItems: StatueDocument[];
  // Whether visibleStatueItems holds a loaded list; false while loading or after a failure.
  visibleLoaded: boolean;
  selectedStatueItem: StatueDocument | null;
  loading: boolean;
  error: string | null;
}

const initialState: StatueState = {
  visibleStatueItems: [],
  visibleLoaded: false,
  selectedStatueItem: null,
  loading: false,
  error: null,
};

export interface StatueNeighbors {
  previous: StatueDocument | null;
  next: StatueDocument | null;
}

export const StatueStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ visibleStatueItems, selectedStatueItem }) => ({
    // The selected statue's neighbors in list order (most recently dedicated first).
    // Nothing at either end, or when the statue isn't in the loaded list.
    neighbors: computed<StatueNeighbors>(() => {
      const items = visibleStatueItems();
      const index = items.findIndex((item) => item.id === selectedStatueItem()?.id);
      if (index < 0) return { previous: null, next: null };
      return { previous: items[index - 1] ?? null, next: items[index + 1] ?? null };
    }),
  })),
  withMethods((store, service = inject(StatueService), pendingTasks = inject(PendingTasks)) => {
    // The detail route's title and data resolvers both ask for the same statue at once.
    let pendingItem: { id: string; result: Promise<StatueDocument | null> } | undefined;
    // A list load that a newer one replaced must not land over it.
    let latestList = 0;
    // Likewise, a detail page left mid-load must not replace the next statue's selection.
    let latestItem = 0;

    // Server rendering waits for the pending task. A transfer-state hit is applied
    // synchronously, so hydration renders the same list the server did.
    async function loadVisible(): Promise<void> {
      const id = ++latestList;
      const result = service.getVisible();
      if (!(result instanceof Promise)) {
        patchState(store, {
          visibleStatueItems: result,
          visibleLoaded: true,
          loading: false,
          error: null,
        });
        return;
      }
      patchState(store, {
        visibleStatueItems: [],
        visibleLoaded: false,
        loading: true,
        error: null,
      });
      const done = pendingTasks.add();
      try {
        const items = await result;
        if (id === latestList) {
          patchState(store, { visibleStatueItems: items, visibleLoaded: true, loading: false });
        }
      } catch {
        if (id === latestList) {
          patchState(store, {
            loading: false,
            error: 'The statues could not be loaded. Please try again later.',
          });
        }
      } finally {
        done();
      }
    }

    return {
      loadVisible,

      // For detail pages, which need the list only for previous/next: reuses a list already
      // loaded (e.g. the one the visitor clicked from) instead of refetching.
      ensureVisible(): Promise<void> {
        return store.visibleLoaded() ? Promise.resolve() : loadVisible();
      },

      // Resolves to the statue, or null if it is missing, hidden, or failed to load.
      loadSelected(id: string): Promise<StatueDocument | null> {
        if (pendingItem?.id === id) {
          return pendingItem.result;
        }
        const request = ++latestItem;
        const result = (async () => {
          try {
            const item = await service.getVisibleById(id);
            if (request === latestItem) {
              patchState(store, { selectedStatueItem: item, error: null });
            }
            return item;
          } catch {
            if (request === latestItem) patchState(store, { selectedStatueItem: null });
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
