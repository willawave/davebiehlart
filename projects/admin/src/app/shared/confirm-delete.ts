import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';

// Asks before a table deletes an item. Closes with true to delete.
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
