import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

export interface ImageDialogData {
  images: string[];
  altTexts: string[];
  index: number;
}

// One photo at full size, with previous/next (buttons or arrow keys) through the rest.
@Component({
  imports: [MatDialogClose, MatIcon, MatIconButton],
  selector: 'app-image-dialog',
  styleUrl: './image-dialog.scss',
  templateUrl: './image-dialog.html',
  // On the document: focus starts on Material's dialog container, outside this host. The
  // listeners exist only while the dialog is open.
  host: {
    '(document:keydown.arrowleft)': 'step(-1)',
    '(document:keydown.arrowright)': 'step(1)',
  },
})
export class ImageDialog {
  protected readonly data = inject<ImageDialogData>(MAT_DIALOG_DATA);
  protected readonly index = signal(this.data.index);
  protected readonly count = this.data.images.length;
  protected readonly src = computed(() => this.data.images[this.index()]);
  protected readonly alt = computed(() => this.data.altTexts[this.index()]);

  protected step(direction: -1 | 1): void {
    this.index.update((i) => (i + direction + this.count) % this.count);
  }
}
