import { inject } from '@angular/core';
import { signalStore, withMethods, withState } from '@ngrx/signals';
import { GalleryDocument } from 'core';
import { GalleryService } from './gallery.service';

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

export const GalleryStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((_store, _service = inject(GalleryService)) => ({
    // Load all gallery items from the service and update the state
    // Load selected gallery item from the service and update the state
    // Add a gallery item from the service and update the state
    // Edit a gallery item from the service and update the state
    // Delete a gallery item from the service and update the state
  })),
);
