import {
  Component,
  DestroyRef,
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
  disabled,
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
import { StatueFormModel } from 'core';
import { FormMap } from '../../shared/form-map/form-map';
import { PhotoField } from '../../shared/photo-field/photo-field';
import { between, notBlank } from '../../shared/validators';
import { StatueFormValue } from '../statue.service';
import { StatueStore } from '../statue.store';

// The add/edit form. Photos upload as soon as they are picked (into `storageKey`'s
// folder), and every upload is reported through `uploaded` so the page can delete the
// ones that are never saved. The location is set on the map or typed as coordinates.
@Component({
  imports: [
    FormField,
    FormMap,
    MatButton,
    MatCheckbox,
    MatDatepickerModule,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    MatSuffix,
    PhotoField,
  ],
  providers: [provideNativeDateAdapter()],
  selector: 'app-statue-form',
  styleUrl: './statue-form.scss',
  templateUrl: './statue-form.html',
})
export class StatueForm {
  private readonly store = inject(StatueStore);

  readonly storageKey = input.required<string>();
  // The statue being edited; a new one starts from StatueFormModel's defaults.
  readonly initial = input<StatueFormValue>();
  readonly saving = input(false);
  readonly saved = output<StatueFormValue>();
  readonly cancelled = output<void>();
  readonly uploaded = output<string[]>();

  protected readonly model = linkedSignal<StatueFormValue>(
    () => this.initial() ?? new StatueFormModel().statueForm(),
  );
  protected readonly statueForm = form(this.model, (statue) => {
    // The save already holds the form's value: lock every field until it finishes, so no
    // edit is silently dropped.
    disabled(statue, { when: () => this.saving() });
    // required() marks the fields required (asterisk, aria-required); notBlank also rejects
    // spaces alone, since values are saved trimmed (toStatueDocument).
    required(statue.name, { message: 'Enter a name.' });
    required(statue.description, { message: 'Enter a description.' });
    validate(statue.name, notBlank('Enter a name.'));
    validate(statue.description, notBlank('Enter a description.'));
    required(statue.dedicated, { message: 'Enter the date it was dedicated.' });
    required(statue.location.venue, { message: 'Enter a venue.' });
    required(statue.location.city, { message: 'Enter a city.' });
    required(statue.location.state, { message: 'Enter a state.' });
    validate(statue.location.venue, notBlank('Enter a venue.'));
    validate(statue.location.city, notBlank('Enter a city.'));
    validate(statue.location.state, notBlank('Enter a state.'));
    // A cleared number input is null; the production schema needs a number.
    required(statue.location.latitude, { message: 'Enter a latitude.' });
    required(statue.location.longitude, { message: 'Enter a longitude.' });
    validate(statue.location.latitude, between(-90, 90, 'Enter a latitude from -90 to 90.'));
    validate(statue.location.longitude, between(-180, 180, 'Enter a longitude from -180 to 180.'));
    minLength(statue.imageUrls, 1, { message: 'Upload at least one photo.' });
  });
  protected readonly images = computed(() => this.model().imageUrls);
  protected readonly photoError = computed(() => {
    const photos = this.statueForm.imageUrls();
    return photos.touched() && photos.invalid() ? this.firstError(this.statueForm.imageUrls) : null;
  });
  protected readonly uploading = signal(0);
  private destroyed = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => (this.destroyed = true));
  }

  protected firstError(field: FieldTree<unknown>): string {
    return field().errors()[0]?.message ?? '';
  }

  protected async upload(files: File[]): Promise<void> {
    this.uploading.set(files.length);
    const storageKey = this.storageKey();
    const urls = await this.store.uploadImages(files, storageKey);
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

  protected setImages(imageUrls: string[]): void {
    this.model.update((value) => ({ ...value, imageUrls }));
    this.statueForm.imageUrls().markAsTouched();
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.statueForm, async () => {
      this.saved.emit(this.model());
      return undefined;
    });
  }
}
