import { DatePipe } from '@angular/common';
import { Component, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { EventDocument, formatEventTime, isUpcoming } from 'core';
import { ConfirmDelete } from '../../shared/confirm-delete';
import { EventStore } from '../event.store';

@Component({
  imports: [DatePipe, MatButton, MatTableModule, RouterLink],
  selector: 'app-event-table',
  styleUrl: './event-table.scss',
  templateUrl: './event-table.html',
})
export class EventTable {
  protected readonly store = inject(EventStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  protected readonly columns = ['name', 'when', 'place', 'status', 'visible', 'actions'];
  protected readonly formatTime = formatEventTime;
  private readonly now = Date.now();

  constructor() {
    void this.store.loadAll();
    afterNextRender(() => this.heading().nativeElement.focus());
  }

  // Past events stay listed here, but the website lists only upcoming ones.
  protected isUpcoming(item: EventDocument): boolean {
    return isUpcoming(item, this.now);
  }

  protected confirmDelete(item: EventDocument): void {
    this.dialog
      .open<ConfirmDelete, { name: string }, boolean>(ConfirmDelete, { data: { name: item.name } })
      .afterClosed()
      .subscribe(async (confirmed) => {
        if (confirmed && (await this.store.remove(item))) {
          this.snackBar.open(`Deleted "${item.name}".`, 'Dismiss', { duration: 5000 });
          this.heading().nativeElement.focus();
        }
      });
  }
}
