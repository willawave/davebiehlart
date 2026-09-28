import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ImageDialog, ImageDialogData } from '../image-dialog/image-dialog';

// A horizontal strip of one item's photos. Prev/next scroll it by most of a screen; each
// photo opens full size in ImageDialog. Photos keep their own proportions at a fixed height.
@Component({
  imports: [],
  selector: 'app-image-track',
  styleUrl: './image-track.scss',
  templateUrl: './image-track.html',
})
export class ImageTrack {
  private readonly dialog = inject(MatDialog);
  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');

  readonly images = input.required<string[]>();
  // What the photos show, e.g. the artwork's name.
  readonly alt = input.required<string>();

  protected readonly altTexts = computed(() => {
    const count = this.images().length;
    return this.images().map((_, i) =>
      count > 1 ? `${this.alt()}, photo ${i + 1} of ${count}` : this.alt(),
    );
  });
  // Both unknown until the browser lays the strip out; the server renders them enabled.
  protected readonly atStart = signal(false);
  protected readonly atEnd = signal(false);

  constructor() {
    afterNextRender(() => this.updateEnds());
  }

  protected scroll(direction: -1 | 1): void {
    const track = this.track().nativeElement;
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: 'smooth' });
  }

  protected updateEnds(): void {
    const { scrollLeft, scrollWidth, clientWidth } = this.track().nativeElement;
    this.atStart.set(scrollLeft <= 1);
    this.atEnd.set(scrollLeft + clientWidth >= scrollWidth - 1);
  }

  protected open(index: number): void {
    this.dialog.open<ImageDialog, ImageDialogData>(ImageDialog, {
      data: { images: this.images(), altTexts: this.altTexts(), index },
      ariaLabel: this.alt(),
      maxWidth: '96vw',
      maxHeight: '96vh',
      panelClass: 'image-dialog-panel',
      autoFocus: 'dialog',
    });
  }
}
