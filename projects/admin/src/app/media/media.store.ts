import { inject } from '@angular/core';
import { signalStore, withMethods, withState } from '@ngrx/signals';
import { MediaDocument } from '../../../../core/src/lib/models/media.model';
import { MediaService } from './media.service';

interface MediaState {
  AllMediaItems: MediaDocument[];
  SelectedMediaItem: MediaDocument | null;
  Loading: boolean;
  Error: string | null;
}

const initialState: MediaState = {
  AllMediaItems: [],
  SelectedMediaItem: null,
  Loading: false,
  Error: null,
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
