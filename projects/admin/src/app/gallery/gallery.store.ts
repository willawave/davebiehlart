import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { GalleryDocument } from 'core';
import { GalleryFormValue, GalleryService, toGalleryFormValue } from './gallery.service';

interface GalleryState {
  allGalleryItems: GalleryDocument[];
  selectedGalleryItem: GalleryDocument | null;
  loading: boolean;
  error: string | null;
}

const initialState: GalleryState = {
  allGalleryItems: [],
  selectedGalleryItem: null,
  loading: false,
  error: null,
};

// Writes resolve to true on success; on failure they set `error` and resolve to false, so
// components can decide what to show without catching.
export const GalleryStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ selectedGalleryItem }) => ({
    // The selected item as the edit form's starting value.
    selectedFormValue: computed(() => {
      const item = selectedGalleryItem();
      return item ? toGalleryFormValue(item) : null;
    }),
  })),
  withMethods((store, service = inject(GalleryService)) => {
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
        return run('The gallery could not be loaded. Please try again.', async () => {
          patchState(store, { allGalleryItems: await service.getAll() });
        });
      },

      loadOne(id: string): Promise<boolean> {
        patchState(store, { selectedGalleryItem: null });
        return run('This gallery item could not be loaded. Please try again.', async () => {
          patchState(store, { selectedGalleryItem: await service.getById(id) });
        });
      },

      newStorageKey(): string {
        return service.newStorageKey();
      },

      add(value: GalleryFormValue, storageKey: string): Promise<boolean> {
        return run('The item could not be saved. Please try again.', async () => {
          await service.add(value, storageKey);
        });
      },

      update(id: string, value: GalleryFormValue, storageKey: string): Promise<boolean> {
        return run('Your changes could not be saved. Please try again.', async () => {
          await service.update(id, value, storageKey);
        });
      },

      remove(item: GalleryDocument): Promise<boolean> {
        return run(`"${item.name}" could not be deleted. Please try again.`, async () => {
          await service.delete(item);
          patchState(store, {
            allGalleryItems: store.allGalleryItems().filter((other) => other.id !== item.id),
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
