import { Component, input, linkedSignal, output } from '@angular/core';
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
import { EventFormModel } from 'core';
import { FormMap } from '../../shared/form-map/form-map';
import { between, httpUrl, notBlank } from '../../shared/validators';
import { EventFormValue } from '../event.service';

// The add/edit form. The location is set on the map or typed as coordinates.
@Component({
  imports: [
    FormField,
    FormMap,
    MatButton,
    MatCheckbox,
    MatDatepickerModule,
    MatError,
    MatFormField,
    MatHint,
    MatInput,
    MatLabel,
    MatSuffix,
  ],
  providers: [provideNativeDateAdapter()],
  selector: 'app-event-form',
  styleUrl: './event-form.scss',
  templateUrl: './event-form.html',
})
export class EventForm {
  // The event being edited; a new one starts from EventFormModel's defaults.
  readonly initial = input<EventFormValue>();
  readonly saving = input(false);
  readonly saved = output<EventFormValue>();
  readonly cancelled = output<void>();

  protected readonly model = linkedSignal<EventFormValue>(
    () => this.initial() ?? new EventFormModel().eventForm(),
  );
  protected readonly eventForm = form(this.model, (event) => {
    // The save already holds the form's value: lock every field until it finishes, so no
    // edit is silently dropped.
    disabled(event, { when: () => this.saving() });
    // required() marks the fields required (asterisk, aria-required); notBlank also rejects
    // spaces alone, since values are saved trimmed (toEventDocument).
    required(event.name, { message: 'Enter a name.' });
    required(event.description, { message: 'Enter a description.' });
    validate(event.name, notBlank('Enter a name.'));
    validate(event.description, notBlank('Enter a description.'));
    required(event.date, { message: 'Enter the date.' });
    required(event.time, { message: 'Enter the start time.' });
    validate(event.link, httpUrl('Enter a full web address, starting with https://.'));
    required(event.location.venue, { message: 'Enter a venue.' });
    required(event.location.city, { message: 'Enter a city.' });
    required(event.location.state, { message: 'Enter a state.' });
    validate(event.location.venue, notBlank('Enter a venue.'));
    validate(event.location.city, notBlank('Enter a city.'));
    validate(event.location.state, notBlank('Enter a state.'));
    // A cleared number input is null; the production schema needs a number.
    required(event.location.latitude, { message: 'Enter a latitude.' });
    required(event.location.longitude, { message: 'Enter a longitude.' });
    validate(event.location.latitude, between(-90, 90, 'Enter a latitude from -90 to 90.'));
    validate(event.location.longitude, between(-180, 180, 'Enter a longitude from -180 to 180.'));
  });

  protected firstError(field: FieldTree<unknown>): string {
    return field().errors()[0]?.message ?? '';
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.eventForm, async () => {
      this.saved.emit(this.model());
      return undefined;
    });
  }
}
