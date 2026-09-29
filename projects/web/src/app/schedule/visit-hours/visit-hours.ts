import { Component, computed, inject } from '@angular/core';
import { BaseLocation, groupWeek, todayIndex, todayStatus } from 'core';
import { ScheduleStore } from '../schedule.store';

// "Visit the gallery": the address, and the weekly hours in a ledger with today's row
// marked. Until Dave saves hours (or if they fail to load) only the address shows.
@Component({
  selector: 'app-visit-hours',
  styleUrl: './visit-hours.scss',
  templateUrl: './visit-hours.html',
})
export class VisitHours {
  protected readonly store = inject(ScheduleStore);
  protected readonly location = BaseLocation;
  // Read once, so the server and hydration agree on "today" (the gallery's, in Central Time).
  private readonly now = new Date();
  protected readonly today = todayIndex(this.now);

  protected readonly status = computed(() => {
    const schedule = this.store.schedule();
    return schedule ? todayStatus(schedule, this.now) : null;
  });
  protected readonly week = computed(() => {
    const schedule = this.store.schedule();
    return schedule ? groupWeek(schedule) : [];
  });

  constructor() {
    void this.store.loadSchedule();
  }
}
