import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventForm } from '../event-form/event-form';
import { EventFormValue } from '../event.service';
import { EventStore } from '../event.store';

@Component({
  imports: [EventForm, RouterLink],
  selector: 'app-event-edit',
  styleUrl: './event-edit.scss',
  templateUrl: './event-edit.html',
})
export class EventEdit {
  protected readonly store = inject(EventStore);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly loaded = computed(() => {
    const item = this.store.selectedEvent();
    return item?.id === this.id ? item : null;
  });
  private destroyed = false;

  constructor() {
    this.store.clearError();
    void this.store.loadOne(this.id);
    afterNextRender(() => this.heading().nativeElement.focus());
    inject(DestroyRef).onDestroy(() => (this.destroyed = true));
  }

  protected async onSave(value: EventFormValue): Promise<void> {
    if (!this.loaded()) return;
    if (!(await this.store.update(this.id, value))) return;
    this.snackBar.open(`Saved "${value.name.trim()}".`, 'Dismiss', { duration: 5000 });
    // The admin may have left mid-save; don't pull them back.
    if (!this.destroyed) await this.router.navigate(['/events']);
  }

  protected cancel(): void {
    void this.router.navigate(['/events']);
  }
}
