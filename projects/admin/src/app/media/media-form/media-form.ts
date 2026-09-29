import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input, linkedSignal, output } from '@angular/core';
import {
  FieldTree,
  FormField,
  disabled,
  form,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatError, MatFormField, MatHint, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MediaFormModel, parseMediaLink, youTubeThumbnailUrl } from 'core';
import { mediaLink, notBlank, uniqueMediaLink } from '../../shared/validators';
import { MediaFormValue } from '../media.service';

// The add/edit form. The link is a YouTube video or a web article; the preview under it
// shows which the site will make of it, so a wrong paste is caught before saving.
@Component({
  imports: [
    FormField,
    MatButton,
    MatCheckbox,
    MatDatepickerModule,
    MatError,
    MatFormField,
    MatHint,
    MatInput,
    MatLabel,
    MatSuffix,
    NgOptimizedImage,
  ],
  providers: [provideNativeDateAdapter()],
  selector: 'app-media-form',
  styleUrl: './media-form.scss',
  templateUrl: './media-form.html',
})
export class MediaForm {
  // The item being edited; a new one starts from MediaFormModel's defaults.
  readonly initial = input<MediaFormValue>();
  // Every other item's link, so the same video or article isn't listed twice.
  readonly otherLinks = input<readonly string[]>([]);
  readonly saving = input(false);
  readonly saved = output<MediaFormValue>();
  readonly cancelled = output<void>();

  protected readonly model = linkedSignal<MediaFormValue>(
    () => this.initial() ?? new MediaFormModel().mediaForm(),
  );
  protected readonly mediaForm = form(this.model, (media) => {
    // The save already holds the form's value: lock every field until it finishes, so no
    // edit is silently dropped.
    disabled(media, { when: () => this.saving() });
    required(media.title, { message: 'Enter a title.' });
    required(media.description, { message: 'Enter a description.' });
    validate(media.title, notBlank('Enter a title.'));
    validate(media.description, notBlank('Enter a description.'));
    required(media.date, { message: 'Enter the date.' });
    required(media.link, { message: 'Enter the link.' });
    validate(media.link, mediaLink());
    validate(
      media.link,
      uniqueMediaLink(() => this.otherLinks(), 'This link is already on the Media page.'),
    );
  });

  // What the site will show for the link; null while it isn't one it can show.
  protected readonly preview = computed(() => parseMediaLink(this.model().link));
  protected readonly thumbnail = youTubeThumbnailUrl;

  protected firstError(field: FieldTree<unknown>): string {
    return field().errors()[0]?.message ?? '';
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.mediaForm, async () => {
      this.saved.emit(this.model());
      return undefined;
    });
  }
}
