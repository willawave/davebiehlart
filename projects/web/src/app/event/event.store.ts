import { inject } from '@angular/core';
import { signalStore, withMethods, withState } from '@ngrx/signals';
import { EventDocument } from 'core';
import { EventService } from './event.service';

interface EventState {
  visibleEvents: EventDocument[];
  selectedEvent: EventDocument | null;
  loading: boolean;
  error: string | null;
}

const initialState: EventState = {
  visibleEvents: [],
  selectedEvent: null,
  loading: false,
  error: null,
};

export const EventStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((_store, _service = inject(EventService)) => ({
    // Load visible events from the service and update the state
    // Load selected event from the service and update the state
  })),
);
