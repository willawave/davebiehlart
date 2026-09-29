import { Component, input, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { EventDocument } from 'core';
import { Timestamp } from 'firebase/firestore';
import { EventForm } from '../event-form/event-form';
import { EventFormValue, toEventFormValue } from '../event.service';
import { EventStore } from '../event.store';
import { EventEdit } from './event-edit';

@Component({ selector: 'app-event-form', template: '' })
class FakeForm {
  readonly initial = input<EventFormValue>();
  readonly saving = input(false);
  readonly saved = output<EventFormValue>();
  readonly cancelled = output<void>();
}

const ITEM: EventDocument = {
  id: 'abc',
  date: Timestamp.fromDate(new Date('2026-10-10T05:00:00Z')),
  description: 'd',
  link: null,
  location: {
    city: 'Elkhorn',
    latitude: 41.28,
    longitude: -96.23,
    state: 'Nebraska',
    street: '',
    venue: 'Main Street Studios',
  },
  name: 'Open Studio',
  time: '18:30',
  visible: true,
};

describe('EventEdit', () => {
  const store = {
    error: signal<string | null>(null),
    loading: signal(false),
    selectedEvent: signal<EventDocument | null>(null),
    selectedFormValue: signal<EventFormValue | null>(null),
    clearError: vi.fn(),
    loadOne: vi.fn(() => Promise.resolve(true)),
    update: vi.fn(() => Promise.resolve(true)),
  };
  const snackBar = { open: vi.fn() };

  function create() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: EventStore, useValue: store },
        { provide: MatSnackBar, useValue: snackBar },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'abc' }) } },
        },
      ],
    });
    TestBed.overrideComponent(EventEdit, {
      remove: { imports: [EventForm] },
      add: { imports: [FakeForm] },
    });
    const fixture = TestBed.createComponent(EventEdit);
    const element: HTMLElement = fixture.nativeElement;
    const form = () =>
      fixture.debugElement.query((el) => el.name === 'app-event-form')?.componentInstance as
        FakeForm | undefined;
    return { fixture, element, form };
  }

  function select(item: EventDocument | null) {
    store.selectedEvent.set(item);
    store.selectedFormValue.set(item ? toEventFormValue(item) : null);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    store.error.set(null);
    store.loading.set(false);
    store.update.mockResolvedValue(true);
    select(null);
  });

  it('should load the event and hand it to the form', async () => {
    select(ITEM);
    const { fixture, form } = create();
    await fixture.whenStable();

    expect(store.loadOne).toHaveBeenCalledWith('abc');
    expect(form()?.initial()?.name).toBe('Open Studio');
    expect(document.activeElement?.textContent).toBe('Edit event');
  });

  it("should not show another event's form while this one loads", async () => {
    select({ ...ITEM, id: 'other' });
    store.loading.set(true);
    const { fixture, element, form } = create();
    await fixture.whenStable();

    expect(form()).toBeUndefined();
    expect(element.textContent).toContain('Loading…');
  });

  it('should say when the event does not exist', async () => {
    const { fixture, element } = create();
    await fixture.whenStable();
    expect(element.textContent).toContain("This event doesn't exist.");
  });

  it('should save and return to the table', async () => {
    select(ITEM);
    const { fixture, form } = create();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();

    const value = { ...toEventFormValue(ITEM), name: ' Open House ' };
    form()?.saved.emit(value);
    await fixture.whenStable();

    expect(store.update).toHaveBeenCalledWith('abc', value);
    expect(snackBar.open).toHaveBeenCalledWith('Saved "Open House".', 'Dismiss', {
      duration: 5000,
    });
    expect(navigate).toHaveBeenCalledWith(['/events']);
  });

  it('should stay on the page when the save fails', async () => {
    select(ITEM);
    store.update.mockResolvedValue(false);
    const { fixture, form } = create();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();

    form()?.saved.emit(toEventFormValue(ITEM));
    await fixture.whenStable();

    expect(navigate).not.toHaveBeenCalled();
    expect(snackBar.open).not.toHaveBeenCalled();
  });

  it('should return to the table on cancel', async () => {
    select(ITEM);
    const { fixture, form } = create();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();
    form()?.cancelled.emit();
    expect(navigate).toHaveBeenCalledWith(['/events']);
  });
});
