import { inject } from '@angular/core';
import { signalStore, withMethods, withState } from '@ngrx/signals';
import { StatueDocument } from 'core';
import { StatueService } from './statue.service';

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
