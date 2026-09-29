import { PendingTasks, inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { ScheduleDocument } from 'core';
import { ScheduleService } from './schedule.service';

interface ScheduleState {
  // Null while loading, when none has been saved, or when the load failed.
  schedule: ScheduleDocument | null;
  loading: boolean;
  error: string | null;
}

const initialState: ScheduleState = {
  schedule: null,
  loading: false,
  error: null,
};

export const ScheduleStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, service = inject(ScheduleService), pendingTasks = inject(PendingTasks)) => {
    // A load that a newer one replaced must not land over it.
    let latest = 0;

    return {
      // Server rendering waits for the pending task. A transfer-state hit is applied
      // synchronously, so hydration renders the same hours the server did.
      async loadSchedule(): Promise<void> {
        const id = ++latest;
        const result = service.getSchedule();
        if (!(result instanceof Promise)) {
          patchState(store, { schedule: result, loading: false, error: null });
          return;
        }
        patchState(store, { loading: true, error: null });
        const done = pendingTasks.add();
        try {
          const schedule = await result;
          if (id === latest) patchState(store, { schedule, loading: false });
        } catch {
          if (id === latest) {
            patchState(store, {
              schedule: null,
              loading: false,
              error: 'The gallery hours could not be loaded. Please try again later.',
            });
          }
        } finally {
          done();
        }
      },
    };
  }),
);
