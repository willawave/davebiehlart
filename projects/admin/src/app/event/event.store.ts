import { inject } from '@angular/core';
import { signalStore, withMethods, withState } from '@ngrx/signals';
import { EventDocument } from '../../../../core/src/lib/models/event.model';
import { EventService } from './event.service';

interface EventState {
  AllEvents: EventDocument[];
  SelectedEvent: EventDocument | null;
  Loading: boolean;
  Error: string | null;
}

const initialState: EventState = {
  AllEvents: [],
  SelectedEvent: null,
  Loading: false,
  Error: null,
};

export const EventStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, service = inject(EventService)) => ({
    // Load all events from the service and update the state
    // Load selected event from the service and update the state
    // Add an event from the service and update the state
    // Edit an event from the service and update the state
    // Delete an event from the service and update the state
  })),
);
