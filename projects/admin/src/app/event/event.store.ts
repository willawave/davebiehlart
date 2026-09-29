import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { EventDocument } from 'core';
import { EventFormValue, EventService, toEventFormValue } from './event.service';

interface EventState {
  allEvents: EventDocument[];
  selectedEvent: EventDocument | null;
  loading: boolean;
  error: string | null;
}

const initialState: EventState = {
  allEvents: [],
  selectedEvent: null,
  loading: false,
  error: null,
};

// Writes resolve to true on success; on failure they set `error` and resolve to false, so
// components can decide what to show without catching.
export const EventStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ selectedEvent }) => ({
    // The selected event as the edit form's starting value.
    selectedFormValue: computed(() => {
      const item = selectedEvent();
      return item ? toEventFormValue(item) : null;
    }),
  })),
  withMethods((store, service = inject(EventService)) => {
    let latestItem = 0;

    async function run(failure: string, work: () => Promise<void>): Promise<boolean> {
      patchState(store, { loading: true, error: null });
      try {
        await work();
        patchState(store, { loading: false });
        return true;
      } catch {
        patchState(store, { loading: false, error: failure });
        return false;
      }
    }

    return {
      loadAll(): Promise<boolean> {
        return run('The events could not be loaded. Please try again.', async () => {
          patchState(store, { allEvents: await service.getAll() });
        });
      },

      // Only the latest load may write: an admin who leaves event A mid-load for event B must
      // not have A's late answer (or failure) replace B and tear down B's edit form.
      async loadOne(id: string): Promise<boolean> {
        const request = ++latestItem;
        patchState(store, { selectedEvent: null, loading: true, error: null });
        try {
          const item = await service.getById(id);
          if (request === latestItem) patchState(store, { selectedEvent: item, loading: false });
          return true;
        } catch {
          if (request === latestItem) {
            patchState(store, {
              loading: false,
              error: 'This event could not be loaded. Please try again.',
            });
          }
          return false;
        }
      },

      add(value: EventFormValue): Promise<boolean> {
        return run('The event could not be saved. Please try again.', async () => {
          await service.add(value);
        });
      },

      update(id: string, value: EventFormValue): Promise<boolean> {
        return run('Your changes could not be saved. Please try again.', async () => {
          await service.update(id, value);
        });
      },

      remove(item: EventDocument): Promise<boolean> {
        return run(`"${item.name}" could not be deleted. Please try again.`, async () => {
          await service.delete(item);
          patchState(store, {
            allEvents: store.allEvents().filter((other) => other.id !== item.id),
          });
        });
      },

      clearError(): void {
        patchState(store, { error: null });
      },
    };
  }),
);
