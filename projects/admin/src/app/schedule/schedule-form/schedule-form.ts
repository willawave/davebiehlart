import { Component, input, linkedSignal, output } from '@angular/core';
import {
  FieldTree,
  FormField,
  applyEach,
  disabled,
  form,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatError, MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { DAY_NAMES, ScheduleFormModel, WEEK_ORDER } from 'core';
import { ScheduleFormValue } from '../schedule.service';

// The weekly hours, one row per day, Monday first. A closed day keeps its times but locks
// them, and skips their checks.
@Component({
  imports: [FormField, MatButton, MatCheckbox, MatError, MatFormField, MatHint, MatInput, MatLabel],
  selector: 'app-schedule-form',
  styleUrl: './schedule-form.scss',
  templateUrl: './schedule-form.html',
})
export class ScheduleForm {
  // The saved schedule; with none saved yet, the form starts from ScheduleFormModel's defaults.
  readonly initial = input<ScheduleFormValue>();
  readonly saving = input(false);
  readonly saved = output<ScheduleFormValue>();
  readonly cancelled = output<void>();

  protected readonly dayNames = WEEK_ORDER.map((day) => DAY_NAMES[day]);

  protected readonly model = linkedSignal<ScheduleFormValue>(
    () => this.initial() ?? new ScheduleFormModel().scheduleForm(),
  );
  protected readonly scheduleForm = form(this.model, (schedule) => {
    // The save already holds the form's value: lock every field until it finishes, so no
    // edit is silently dropped.
    disabled(schedule, { when: () => this.saving() });
    applyEach(schedule.days, (day) => {
      disabled(day.open, ({ valueOf }) => valueOf(day.isClosed));
      disabled(day.close, ({ valueOf }) => valueOf(day.isClosed));
      required(day.open, {
        message: 'Enter the opening time.',
        when: ({ valueOf }) => !valueOf(day.isClosed),
      });
      required(day.close, {
        message: 'Enter the closing time.',
        when: ({ valueOf }) => !valueOf(day.isClosed),
      });
      // "HH:mm" times compare as text.
      validate(day.close, ({ value, valueOf }) => {
        const opens = valueOf(day.open);
        return valueOf(day.isClosed) || !opens || !value() || value() > opens
          ? null
          : { kind: 'order', message: 'Closing time must be after opening time.' };
      });
    });
  });

  protected firstError(field: FieldTree<unknown>): string {
    return field().errors()[0]?.message ?? '';
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.scheduleForm, async () => {
      this.saved.emit(this.model());
      return undefined;
    });
  }
}
