import { DatePipe } from '@angular/common';
import { Component, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { GalleryDocument } from 'core';
import { GalleryStore } from '../gallery.store';

@Component({
  imports: [MatButton, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle],
  selector: 'app-confirm-delete',
  template: `
    <h2 mat-dialog-title>Delete "{{ name }}"?</h2>
    <mat-dialog-content>
      <p>This removes it from the website and deletes its photos. It can't be undone.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button type="button" matButton="outlined" [mat-dialog-close]="false" cdkFocusInitial>
        Keep it
      </button>
      <button type="button" matButton="filled" [mat-dialog-close]="true">Delete</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDelete {
  protected readonly name = inject<{ name: string }>(MAT_DIALOG_DATA).name;
}

@Component({
  imports: [DatePipe, MatButton, MatTableModule, RouterLink],
  selector: 'app-gallery-table',
  styleUrl: './gallery-table.scss',
  templateUrl: './gallery-table.html',
})
export class GalleryTable {
  protected readonly store = inject(GalleryStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  protected readonly columns = ['cover', 'name', 'style', 'visible', 'created', 'actions'];

  constructor() {
    void this.store.loadAll();
    afterNextRender(() => this.heading().nativeElement.focus());
  }

  protected confirmDelete(item: GalleryDocument): void {
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
