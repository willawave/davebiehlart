import {
  Component,
  Injector,
  afterNextRender,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ACCEPTED_IMAGE_TYPES, imageFileProblem } from '../file.service';

// A form's photo list: pick files, reorder, remove. The first photo is the cover. It uploads
// nothing itself: accepted files go out through `filesPicked`, and the form uploads them
// through its store and appends the URLs to `images`.
@Component({
  imports: [MatButton, MatProgressSpinner],
  selector: 'app-photo-field',
  styleUrl: './photo-field.scss',
  templateUrl: './photo-field.html',
})
export class PhotoField {
  private readonly injector = inject(Injector);

  readonly images = model.required<string[]>();
  // How many photos are uploading right now.
  readonly uploading = input(0);
  readonly disabled = input(false);
  // A validation message for the list as a whole, e.g. "Upload at least one photo."
  readonly error = input<string | null>(null);
  readonly filesPicked = output<File[]>();

  protected readonly accept = ACCEPTED_IMAGE_TYPES.join(',');
  protected readonly fileProblems = signal<string[]>([]);

  protected pick(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    const problems = files.map(imageFileProblem).filter((problem) => problem !== null);
    this.fileProblems.set(problems);
    const accepted = files.filter((file) => !imageFileProblem(file));
    if (accepted.length) this.filesPicked.emit(accepted);
  }

  protected move(index: number, direction: -1 | 1): void {
    const images = [...this.images()];
    const target = index + direction;
    [images[index], images[target]] = [images[target], images[index]];
    this.images.set(images);
    // The buttons move with their photo; keep focus on the one just used, or its opposite
    // when the photo reached an end.
    const side = direction < 0 ? 'left' : 'right';
    const atEnd = target === 0 || target === images.length - 1;
    this.focusLater(`photo-${target}-move-${atEnd ? (side === 'left' ? 'right' : 'left') : side}`);
  }

  protected remove(index: number): void {
    const images = this.images().filter((_, i) => i !== index);
    this.images.set(images);
    this.focusLater(
      images.length ? `photo-${Math.min(index, images.length - 1)}-remove` : 'upload',
    );
  }

  private focusLater(id: string): void {
    afterNextRender(() => document.getElementById(id)?.focus(), { injector: this.injector });
  }
}
