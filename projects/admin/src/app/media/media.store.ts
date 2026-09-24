import { inject } from '@angular/core';
import { signalStore, withMethods, withState } from '@ngrx/signals';
import { MediaDocument } from 'core';
import { MediaService } from './media.service';

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

export const MediaStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, service = inject(MediaService)) => ({
    // Load all media items from the service and update the state
    // Load selected media item from the service and update the state
    // Add a media item from the service and update the state
    // Edit a media item from the service and update the state
    // Delete a media item from the service and update the state
  })),
);
