import { Component, input, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, provideRouter } from '@angular/router';
import { EventForm } from '../event-form/event-form';
import { EventFormValue } from '../event.service';
import { EventStore } from '../event.store';
import { EventAdd } from './event-add';

@Component({ selector: 'app-event-form', template: '' })
class FakeForm {
  readonly initial = input<EventFormValue>();
  readonly saving = input(false);
  readonly saved = output<EventFormValue>();
  readonly cancelled = output<void>();
}

describe('EventAdd', () => {
  const store = {
    error: signal<string | null>(null),
    loading: signal(false),
    clearError: vi.fn(),
    add: vi.fn(() => Promise.resolve(true)),
  };
  const snackBar = { open: vi.fn() };
  const value = { name: ' Open Studio ' } as EventFormValue;

  function create() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: EventStore, useValue: store },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    TestBed.overrideComponent(EventAdd, {
      remove: { imports: [EventForm] },
      add: { imports: [FakeForm] },
    });
    const fixture = TestBed.createComponent(EventAdd);
    const form = fixture.debugElement.children[0].query((el) => el.name === 'app-event-form');
    return { fixture, form: () => form.componentInstance as FakeForm };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    store.add.mockResolvedValue(true);
    store.error.set(null);
  });

  it('should clear old errors and focus the heading', async () => {
    const { fixture } = create();
    await fixture.whenStable();
    expect(document.activeElement?.textContent).toBe('Add event');
    expect(store.clearError).toHaveBeenCalled();
  });

  it('should save and return to the table', async () => {
    const { fixture, form } = create();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();

    form().saved.emit(value);
    await fixture.whenStable();

    expect(store.add).toHaveBeenCalledWith(value);
    expect(snackBar.open).toHaveBeenCalledWith('Added "Open Studio".', 'Dismiss', {
      duration: 5000,
    });
    expect(navigate).toHaveBeenCalledWith(['/events']);
  });

  it('should stay on the page, showing the error, when the save fails', async () => {
    store.add.mockResolvedValue(false);
    const { fixture, form } = create();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();

    form().saved.emit(value);
    store.error.set('The event could not be saved. Please try again.');
    await fixture.whenStable();

    expect(navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'could not be saved',
    );
  });

  it('should not pull an admin back who left mid-save', async () => {
    let finish!: (saved: boolean) => void;
    store.add.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { fixture, form } = create();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();

    form().saved.emit(value);
    fixture.destroy();
    finish(true);
    await new Promise((resolve) => setTimeout(resolve));

    expect(snackBar.open).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('should return to the table on cancel', async () => {
    const { fixture, form } = create();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();
    form().cancelled.emit();
    expect(navigate).toHaveBeenCalledWith(['/events']);
  });
});
