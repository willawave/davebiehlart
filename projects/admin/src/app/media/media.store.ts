import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { MediaDocument } from 'core';
import { MediaFormValue, MediaService, toMediaFormValue } from './media.service';

interface MediaState {
  allMediaItems: MediaDocument[];
  selectedMediaItem: MediaDocument | null;
  loading: boolean;
  error: string | null;
}

const initialState: MediaState = {
  allMediaItems: [],
  selectedMediaItem: null,
  loading: false,
  error: null,
};

// Writes resolve to true on success; on failure they set `error` and resolve to false, so
// components can decide what to show without catching.
export const MediaStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ selectedMediaItem }) => ({
    // The selected item as the edit form's starting value.
    selectedFormValue: computed(() => {
      const item = selectedMediaItem();
      return item ? toMediaFormValue(item) : null;
    }),
  })),
  withMethods((store, service = inject(MediaService)) => {
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
        return run('The media items could not be loaded. Please try again.', async () => {
          patchState(store, { allMediaItems: await service.getAll() });
        });
      },

      // Only the latest load may write: an admin who leaves item A mid-load for item B must
      // not have A's late answer (or failure) replace B and tear down B's edit form.
      async loadOne(id: string): Promise<boolean> {
        const request = ++latestItem;
        patchState(store, { selectedMediaItem: null, loading: true, error: null });
        try {
          const item = await service.getById(id);
          if (request === latestItem) {
            patchState(store, { selectedMediaItem: item, loading: false });
          }
          return true;
        } catch {
          if (request === latestItem) {
            patchState(store, {
              loading: false,
              error: 'This media item could not be loaded. Please try again.',
            });
          }
          return false;
        }
      },

      add(value: MediaFormValue): Promise<boolean> {
        return run('The media item could not be saved. Please try again.', async () => {
          await service.add(value);
        });
      },

      update(id: string, value: MediaFormValue): Promise<boolean> {
        return run('Your changes could not be saved. Please try again.', async () => {
          await service.update(id, value);
        });
      },

      remove(item: MediaDocument): Promise<boolean> {
        return run(`"${item.title}" could not be deleted. Please try again.`, async () => {
          await service.delete(item);
          patchState(store, {
            allMediaItems: store.allMediaItems().filter((other) => other.id !== item.id),
          });
        });
      },

      clearError(): void {
        patchState(store, { error: null });
      },
    };
  }),
);
