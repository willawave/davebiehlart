import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { StatueDocument } from 'core';
import { StatueFormValue, StatueService, toStatueFormValue } from './statue.service';

interface StatueState {
  allStatueItems: StatueDocument[];
  selectedStatueItem: StatueDocument | null;
  loading: boolean;
  error: string | null;
}

const initialState: StatueState = {
  allStatueItems: [],
  selectedStatueItem: null,
  loading: false,
  error: null,
};

// Writes resolve to true on success; on failure they set `error` and resolve to false, so
// components can decide what to show without catching.
export const StatueStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ selectedStatueItem }) => ({
    // The selected item as the edit form's starting value.
    selectedFormValue: computed(() => {
      const item = selectedStatueItem();
      return item ? toStatueFormValue(item) : null;
    }),
  })),
  withMethods((store, service = inject(StatueService)) => {
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
        return run('The statues could not be loaded. Please try again.', async () => {
          patchState(store, { allStatueItems: await service.getAll() });
        });
      },

      // Only the latest load may write: an admin who leaves statue A mid-load for statue B must
      // not have A's late answer (or failure) replace B and tear down B's edit form.
      async loadOne(id: string): Promise<boolean> {
        const request = ++latestItem;
        patchState(store, { selectedStatueItem: null, loading: true, error: null });
        try {
          const item = await service.getById(id);
          if (request === latestItem)
            patchState(store, { selectedStatueItem: item, loading: false });
          return true;
        } catch {
          if (request === latestItem) {
            patchState(store, {
              loading: false,
              error: 'This statue could not be loaded. Please try again.',
            });
          }
          return false;
        }
      },

      newStorageKey(): string {
        return service.newStorageKey();
      },

      add(value: StatueFormValue, storageKey: string): Promise<boolean> {
        return run('The statue could not be saved. Please try again.', async () => {
          await service.add(value, storageKey);
        });
      },

      update(id: string, value: StatueFormValue, storageKey: string): Promise<boolean> {
        return run('Your changes could not be saved. Please try again.', async () => {
          await service.update(id, value, storageKey);
        });
      },

      remove(item: StatueDocument): Promise<boolean> {
        return run(`"${item.name}" could not be deleted. Please try again.`, async () => {
          await service.delete(item);
          patchState(store, {
            allStatueItems: store.allStatueItems().filter((other) => other.id !== item.id),
          });
        });
      },

      // Uploads don't touch `loading`, so the form stays usable while photos upload.
      async uploadImages(files: readonly File[], storageKey: string): Promise<string[] | null> {
        patchState(store, { error: null });
        try {
          return await service.uploadImages(files, storageKey);
        } catch {
          patchState(store, { error: 'The photos could not be uploaded. Please try again.' });
          return null;
        }
      },

      // Best effort: a photo left behind is only an orphaned file, never a broken page.
      async discardImages(urls: readonly string[], storageKey: string): Promise<void> {
        if (!urls.length) return;
        await service.discardImages(urls, storageKey).catch(() => undefined);
      },

      clearError(): void {
        patchState(store, { error: null });
      },
    };
  }),
);
