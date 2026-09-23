import { inject } from '@angular/core';
import { signalStore, withMethods, withState } from '@ngrx/signals';
import { MediaDocument } from '../../../../core/src/lib/models/media.model';
import { MediaService } from './media.service';

interface MediaState {
  visibleMediaItems: MediaDocument[];
  selectedMediaItem: MediaDocument | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: MediaState = {
  visibleMediaItems: [],
  selectedMediaItem: null,
  isLoading: false,
  error: null,
};

export const MediaStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, service = inject(MediaService)) => ({
    // Load visible media items from the service and update the state
    // Load selected media item from the service and update the state
  })),
);
