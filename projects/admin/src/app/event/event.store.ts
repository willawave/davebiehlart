import { inject } from '@angular/core';
import { signalStore, withMethods, withState } from '@ngrx/signals';
import { EventDocument } from 'core';
import { EventService } from './event.service';

interface EventState {
  allEvents: EventDocument[];
  selectedEvent: EventDocument | null;
  loading: boolean;
  error: string | null;
}

const initialState: EventState = {
  allEvents: [],
  selectedEvent: null,
  loading: false,
  error: null,
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
