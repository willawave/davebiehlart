import { inject } from '@angular/core';
import { signalStore, withMethods, withState } from '@ngrx/signals';
import { StatueDocument } from 'core';
import { StatueService } from './statue.service';

interface StatueState {
  visibleStatueItems: StatueDocument[];
  selectedStatueItem: StatueDocument | null;
  loading: boolean;
  error: string | null;
}

const initialState: StatueState = {
  visibleStatueItems: [],
  selectedStatueItem: null,
  loading: false,
  error: null,
};

export const StatueStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, service = inject(StatueService)) => ({
    // Load visible items from the service and update the state
    // Load selected item from the service and update the state
  })),
);
