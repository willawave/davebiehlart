import { DatePipe } from '@angular/common';
import { Component, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { StatueDocument } from 'core';
import { ConfirmDelete } from '../../shared/confirm-delete';
import { StatueStore } from '../statue.store';

@Component({
  imports: [DatePipe, MatButton, MatTableModule, RouterLink],
  selector: 'app-statue-table',
  styleUrl: './statue-table.scss',
  templateUrl: './statue-table.html',
})
export class StatueTable {
  protected readonly store = inject(StatueStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  protected readonly columns = ['cover', 'name', 'place', 'visible', 'dedicated', 'actions'];

  constructor() {
    void this.store.loadAll();
    afterNextRender(() => this.heading().nativeElement.focus());
  }

  protected confirmDelete(item: StatueDocument): void {
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
