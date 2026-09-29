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
import { EventForm } from '../event-form/event-form';
import { EventFormValue } from '../event.service';
import { EventStore } from '../event.store';

@Component({
  imports: [EventForm, RouterLink],
  selector: 'app-event-add',
  styleUrl: './event-add.scss',
  templateUrl: './event-add.html',
})
export class EventAdd {
  protected readonly store = inject(EventStore);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');
  private destroyed = false;

  constructor() {
    this.store.clearError();
    afterNextRender(() => this.heading().nativeElement.focus());
    inject(DestroyRef).onDestroy(() => (this.destroyed = true));
  }

  protected async onSave(value: EventFormValue): Promise<void> {
    if (!(await this.store.add(value))) return;
    this.snackBar.open(`Added "${value.name.trim()}".`, 'Dismiss', { duration: 5000 });
    // The admin may have left mid-save; don't pull them back.
    if (!this.destroyed) await this.router.navigate(['/events']);
  }

  protected cancel(): void {
    void this.router.navigate(['/events']);
  }
}
