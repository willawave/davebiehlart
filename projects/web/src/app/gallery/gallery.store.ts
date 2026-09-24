import { inject } from '@angular/core';
import { signalStore, withMethods, withState } from '@ngrx/signals';
import { GalleryDocument } from 'core';
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
  withMethods((store, service = inject(GalleryService)) => ({
    // Load visible items from the service and update the state
    // Load selected item from the service and update the state
  })),
);
