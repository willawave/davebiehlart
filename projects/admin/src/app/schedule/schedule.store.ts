import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { ScheduleDocument } from 'core';
import {
  ScheduleFormValue,
  ScheduleService,
  toScheduleDocument,
  toScheduleFormValue,
} from './schedule.service';

interface ScheduleState {
  // Null until loaded, and while no schedule has been saved yet.
  schedule: ScheduleDocument | null;
  loaded: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: ScheduleState = {
  schedule: null,
  loaded: false,
  loading: false,
  error: null,
};

// Writes resolve to true on success; on failure they set `error` and resolve to false, so
// components can decide what to show without catching.
export const ScheduleStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ schedule }) => ({
    // The saved schedule as the form's starting value; undefined starts from the defaults.
    formValue: computed(() => {
      const current = schedule();
      return current ? toScheduleFormValue(current) : undefined;
    }),
  })),
  withMethods((store, service = inject(ScheduleService)) => {
    async function run(failure: string, work: () => Promise<void>): Promise<boolean> {
      patchState(store, { loading: true, error: null });
      try {
        await work();
        patchState(store, { loading: false });
        return true;
      } catch {
        patchState(store, { loading: false, error: failure });
        return false;
      }
    }

    return {
      load(): Promise<boolean> {
        patchState(store, { loaded: false });
        return run('The schedule could not be loaded. Please try again.', async () => {
          patchState(store, { schedule: await service.get(), loaded: true });
        });
      },

      save(value: ScheduleFormValue): Promise<boolean> {
        return run('The schedule could not be saved. Please try again.', async () => {
          const id = await service.save(store.schedule()?.id ?? null, value);
          patchState(store, { schedule: { ...toScheduleDocument(value), id } });
        });
      },

      clearError(): void {
        patchState(store, { error: null });
      },
    };
  }),
);
