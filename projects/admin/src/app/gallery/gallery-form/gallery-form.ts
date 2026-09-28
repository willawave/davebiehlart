import {
  Component,
  DestroyRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import {
  FieldTree,
  FormField,
  form,
  minLength,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatError, MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatOption, MatSelect } from '@angular/material/select';
import { GalleryFormModel, GalleryStyle } from 'core';
import { ACCEPTED_IMAGE_TYPES, imageFileProblem } from '../../shared/file.service';
import { GalleryFormValue } from '../gallery.service';
import { GalleryStore } from '../gallery.store';

function positive(message: string) {
  return ({ value }: { value: () => number | null }) => {
    const current = value();
    return current === null || current > 0 ? null : { kind: 'positive', message };
  };
}

// The add/edit form. Photos upload as soon as they are picked (into `storageKey`'s
// folder), and every upload is reported through `uploaded` so the page can delete the
// ones that are never saved.
@Component({
  imports: [
    FormField,
    MatButton,
    MatCheckbox,
    MatDatepickerModule,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    MatOption,
    MatProgressSpinner,
    MatSelect,
    MatSuffix,
  ],
  providers: [provideNativeDateAdapter()],
  selector: 'app-gallery-form',
  styleUrl: './gallery-form.scss',
  templateUrl: './gallery-form.html',
})
export class GalleryForm {
  private readonly store = inject(GalleryStore);
  private readonly injector = inject(Injector);

  readonly storageKey = input.required<string>();
  // The item being edited; a new item starts from GalleryFormModel's defaults.
  readonly initial = input<GalleryFormValue>();
  readonly saving = input(false);
  readonly saved = output<GalleryFormValue>();
  readonly cancelled = output<void>();
  readonly uploaded = output<string[]>();

  protected readonly styles = Object.values(GalleryStyle);
  protected readonly accept = ACCEPTED_IMAGE_TYPES.join(',');
  protected readonly model = linkedSignal<GalleryFormValue>(
    () => this.initial() ?? new GalleryFormModel().galleryForm(),
  );
  protected readonly galleryForm = form(this.model, (item) => {
    required(item.name, { message: 'Enter a name.' });
    required(item.description, { message: 'Enter a description.' });
    required(item.style, { message: 'Choose a style.' });
    required(item.created, { message: 'Enter the date it was created.' });
    // A cleared number input is null; the production schema needs a number.
    required(item.height, { message: 'Enter a height.' });
    required(item.width, { message: 'Enter a width.' });
    required(item.depth, { message: 'Enter a depth.' });
    validate(item.height, positive('Enter a height greater than 0.'));
    validate(item.width, positive('Enter a width greater than 0.'));
    validate(item.depth, positive('Enter a depth greater than 0.'));
    validate(item.weight, positive('Enter a weight greater than 0, or leave it empty.'));
    minLength(item.imageUrls, 1, { message: 'Upload at least one photo.' });
  });
  protected readonly images = computed(() => this.model().imageUrls);
  protected readonly uploading = signal(0);
  protected readonly fileProblems = signal<string[]>([]);
  private destroyed = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => (this.destroyed = true));
  }

  protected firstError(field: FieldTree<unknown>): string {
    return field().errors()[0]?.message ?? '';
  }

  protected async pick(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    const problems = files.map(imageFileProblem).filter((problem) => problem !== null);
    this.fileProblems.set(problems);
    const accepted = files.filter((file) => !imageFileProblem(file));
    if (!accepted.length) return;

    this.uploading.set(accepted.length);
    const storageKey = this.storageKey();
    const urls = await this.store.uploadImages(accepted, storageKey);
    // The page closed mid-upload (Save is disabled while uploading, so nothing saved
    // these): nobody is left to report them to, so delete them here.
    if (this.destroyed) {
      if (urls) void this.store.discardImages(urls, storageKey);
      return;
    }
    this.uploading.set(0);
    if (urls) {
      this.uploaded.emit(urls);
      this.setImages([...this.images(), ...urls]);
    }
  }

  protected move(index: number, direction: -1 | 1): void {
    const images = [...this.images()];
    const target = index + direction;
    [images[index], images[target]] = [images[target], images[index]];
    this.setImages(images);
    // The buttons move with their photo; keep focus on the one just used, or its opposite
    // when the photo reached an end.
    const side = direction < 0 ? 'left' : 'right';
    const atEnd = target === 0 || target === images.length - 1;
    this.focusLater(`photo-${target}-move-${atEnd ? (side === 'left' ? 'right' : 'left') : side}`);
  }

  protected remove(index: number): void {
    const images = this.images().filter((_, i) => i !== index);
    this.setImages(images);
    this.focusLater(
      images.length ? `photo-${Math.min(index, images.length - 1)}-remove` : 'upload',
    );
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.galleryForm, async () => {
      this.saved.emit(this.model());
      return undefined;
    });
  }

  private setImages(imageUrls: string[]): void {
    this.model.update((value) => ({ ...value, imageUrls }));
    this.galleryForm.imageUrls().markAsTouched();
  }

  private focusLater(id: string): void {
    afterNextRender(() => document.getElementById(id)?.focus(), { injector: this.injector });
  }
}
