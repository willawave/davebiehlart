import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { ScheduleForm } from '../schedule-form/schedule-form';
import { ScheduleFormValue } from '../schedule.service';
import { ScheduleStore } from '../schedule.store';

// The gallery's weekly hours. There is only ever one schedule, so this page edits it in
// place; saving before one exists writes the first.
@Component({
  imports: [RouterLink, ScheduleForm],
  selector: 'app-schedule-page',
  templateUrl: './schedule-page.html',
})
export class SchedulePage {
  protected readonly store = inject(ScheduleStore);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');
  private destroyed = false;

  constructor() {
    this.store.clearError();
    void this.store.load();
    afterNextRender(() => this.heading().nativeElement.focus());
    inject(DestroyRef).onDestroy(() => (this.destroyed = true));
  }

  protected async onSave(value: ScheduleFormValue): Promise<void> {
    if (!(await this.store.save(value))) return;
    this.snackBar.open('Saved the schedule.', 'Dismiss', { duration: 5000 });
    // The admin may have left mid-save; don't pull them back.
    if (!this.destroyed) await this.router.navigate(['/dashboard']);
  }

  protected cancel(): void {
    void this.router.navigate(['/dashboard']);
  }
}
