import { PendingTasks, inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { EventDocument } from 'core';
import { EventService } from './event.service';

interface EventState {
  // Visible events still to come, soonest first.
  upcomingEvents: EventDocument[];
  selectedEvent: EventDocument | null;
  loading: boolean;
  error: string | null;
}

const initialState: EventState = {
  upcomingEvents: [],
  selectedEvent: null,
  loading: false,
  error: null,
};

export const EventStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, service = inject(EventService), pendingTasks = inject(PendingTasks)) => {
    // The detail route's title and data resolvers both ask for the same event at once.
    let pendingItem: { id: string; result: Promise<EventDocument | null> } | undefined;
    // A list load that a newer one replaced must not land over it.
    let latestList = 0;
    // Likewise, a detail page left mid-load must not replace the next event's selection.
    let latestItem = 0;

    return {
      // Server rendering waits for the pending task. A transfer-state hit is applied
      // synchronously, so hydration renders the same list the server did.
      async loadUpcoming(): Promise<void> {
        const id = ++latestList;
        const result = service.getUpcoming();
        if (!(result instanceof Promise)) {
          patchState(store, { upcomingEvents: result, loading: false, error: null });
          return;
        }
        patchState(store, { upcomingEvents: [], loading: true, error: null });
        const done = pendingTasks.add();
        try {
          const items = await result;
          if (id === latestList) patchState(store, { upcomingEvents: items, loading: false });
        } catch {
          if (id === latestList) {
            patchState(store, {
              loading: false,
              error: 'The events could not be loaded. Please try again later.',
            });
          }
        } finally {
          done();
        }
      },

      // Resolves to the event, or null if it is missing, hidden, or failed to load.
      loadSelected(id: string): Promise<EventDocument | null> {
        if (pendingItem?.id === id) {
          return pendingItem.result;
        }
        const request = ++latestItem;
        const result = (async () => {
          try {
            const item = await service.getVisibleById(id);
            if (request === latestItem) {
              patchState(store, { selectedEvent: item, error: null });
            }
            return item;
          } catch {
            if (request === latestItem) patchState(store, { selectedEvent: null });
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
