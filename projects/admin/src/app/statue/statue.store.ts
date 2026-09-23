import { inject } from '@angular/core';
import { signalStore, withMethods, withState } from '@ngrx/signals';
import { StatueDocument } from '../../../../core/src/lib/models/statue.model';
import { StatueService } from './statue.service';

interface StatueState {
  AllStatueItems: StatueDocument[];
  SelectedStatueItem: StatueDocument | null;
  Loading: boolean;
  Error: string | null;
}

const initialState: StatueState = {
  AllStatueItems: [],
  SelectedStatueItem: null,
  Loading: false,
  Error: null,
};

export const StatueStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, service = inject(StatueService)) => ({
    // Load all statue items from the service and update the state
    // Load selected statue item from the service and update the state
    // Add a statue item from the service and update the state
    // Edit a statue item from the service and update the state
    // Delete a statue item from the service and update the state
  })),
);
