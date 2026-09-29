import { Component, input, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { ScheduleFormModel } from 'core';
import { ScheduleForm } from '../schedule-form/schedule-form';
import { ScheduleFormValue } from '../schedule.service';
import { ScheduleStore } from '../schedule.store';
import { SchedulePage } from './schedule-page';

@Component({ selector: 'app-schedule-form', template: '' })
class FakeForm {
  readonly initial = input<ScheduleFormValue>();
  readonly saving = input(false);
  readonly saved = output<ScheduleFormValue>();
  readonly cancelled = output<void>();
}

describe('SchedulePage', () => {
  const value = new ScheduleFormModel().scheduleForm();
  const store = {
    error: signal<string | null>(null),
    loaded: signal(false),
    loading: signal(false),
    formValue: signal<ScheduleFormValue | undefined>(undefined),
    clearError: vi.fn(),
    load: vi.fn(() => Promise.resolve(true)),
    save: vi.fn(() => Promise.resolve(true)),
  };
  const snackBar = { open: vi.fn() };

  async function create() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ScheduleStore, useValue: store },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    TestBed.overrideComponent(SchedulePage, {
      remove: { imports: [ScheduleForm] },
      add: { imports: [FakeForm] },
    });
    const fixture = TestBed.createComponent(SchedulePage);
    await fixture.whenStable();
    return fixture;
  }

  const form = (fixture: Awaited<ReturnType<typeof create>>) =>
    fixture.debugElement.query(By.directive(FakeForm))?.componentInstance as FakeForm | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    store.error.set(null);
    store.loaded.set(true);
    store.loading.set(false);
    store.formValue.set(value);
  });

  it('should load the schedule and hand it to the form', async () => {
    const fixture = await create();
    expect(store.clearError).toHaveBeenCalled();
    expect(store.load).toHaveBeenCalled();
    expect(form(fixture)?.initial()).toBe(value);
  });

  it('should show loading until the schedule arrives', async () => {
    store.loaded.set(false);
    store.loading.set(true);
    const fixture = await create();
    expect(form(fixture)).toBeUndefined();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Loading');
  });

  it('should announce a failed load', async () => {
    store.loaded.set(false);
    store.error.set('The schedule could not be loaded. Please try again.');
    const fixture = await create();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'could not be loaded',
    );
  });

  it('should save, confirm, and return to the dashboard', async () => {
    const fixture = await create();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    form(fixture)?.saved.emit(value);
    await fixture.whenStable();

    expect(store.save).toHaveBeenCalledWith(value);
    expect(snackBar.open).toHaveBeenCalledWith('Saved the schedule.', 'Dismiss', {
      duration: 5000,
    });
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should stay on the page when the save fails', async () => {
    store.save.mockResolvedValueOnce(false);
    const fixture = await create();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
    form(fixture)?.saved.emit(value);
    await fixture.whenStable();

    expect(snackBar.open).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
