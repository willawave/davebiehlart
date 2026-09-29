import { DatePipe } from '@angular/common';
import { Component, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { MediaDocument, parseMediaLink } from 'core';
import { ConfirmDelete } from '../../shared/confirm-delete';
import { MediaStore } from '../media.store';

@Component({
  imports: [DatePipe, MatButton, MatTableModule, RouterLink],
  selector: 'app-media-table',
  styleUrl: './media-table.scss',
  templateUrl: './media-table.html',
})
export class MediaTable {
  protected readonly store = inject(MediaStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  protected readonly columns = ['title', 'date', 'type', 'visible', 'actions'];

  constructor() {
    void this.store.loadAll();
    afterNextRender(() => this.heading().nativeElement.focus());
  }

  // "Invalid link" flags an old link the website can't show, so it can be fixed.
  protected type(item: MediaDocument): string {
    const link = parseMediaLink(item.link);
    if (!link) return 'Invalid link';
    return link.kind === 'video' ? 'Video' : `Article · ${link.site}`;
  }

  protected confirmDelete(item: MediaDocument): void {
    this.dialog
      .open<ConfirmDelete, { name: string }, boolean>(ConfirmDelete, { data: { name: item.title } })
      .afterClosed()
      .subscribe(async (confirmed) => {
        if (confirmed && (await this.store.remove(item))) {
          this.snackBar.open(`Deleted "${item.title}".`, 'Dismiss', { duration: 5000 });
          this.heading().nativeElement.focus();
        }
      });
  }
}
