import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { EventDocument } from 'core';
import { Timestamp } from 'firebase/firestore';
import { of } from 'rxjs';
import { ConfirmDelete } from '../../shared/confirm-delete';
import { EventStore } from '../event.store';
import { EventTable } from './event-table';

const DAY = 24 * 60 * 60 * 1000;

const item = (id: string, overrides: Partial<EventDocument> = {}): EventDocument => ({
  id,
  // Local noon, so the date reads the same in every time zone.
  date: Timestamp.fromDate(new Date(2024, 2, 14, 12)),
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
  name: `Item ${id}`,
  time: '18:30',
  visible: true,
  ...overrides,
});

describe('EventTable', () => {
  let fixture: ComponentFixture<EventTable>;
  let element: HTMLElement;
  const store = {
    allEvents: signal<EventDocument[]>([]),
    loading: signal(false),
    error: signal<string | null>(null),
    loadAll: vi.fn(() => Promise.resolve(true)),
    remove: vi.fn(() => Promise.resolve(true)),
  };
  const dialog = { open: vi.fn() };
  const snackBar = { open: vi.fn() };

  async function create() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: EventStore, useValue: store },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    fixture = TestBed.createComponent(EventTable);
    element = fixture.nativeElement;
    await fixture.whenStable();
  }

  beforeEach(() => {
    vi.clearAllMocks();
    store.allEvents.set([
      item('a', { date: Timestamp.fromMillis(Date.now() + 30 * DAY) }),
      item('b', { visible: false, time: '' }),
    ]);
    store.loading.set(false);
    store.error.set(null);
  });

  it('should load every event and list it with its details and actions', async () => {
    await create();
    expect(store.loadAll).toHaveBeenCalled();

    const rows = element.querySelectorAll('tr[mat-row]');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Item a');
    expect(rows[0].textContent).toContain('6:30 PM');
    expect(rows[0].textContent).toContain('Main Street Studios, Elkhorn');
    expect(rows[0].textContent).toContain('Upcoming');
    expect(rows[0].textContent).toContain('Visible');
    expect(rows[1].textContent).toContain('Mar 14, 2024');
    expect(rows[1].textContent).not.toContain('·');
    expect(rows[1].textContent).toContain('Past');
    expect(rows[1].textContent).toContain('Hidden');
    expect(rows[0].querySelector('a[aria-label="Edit Item a"]')?.getAttribute('href')).toBe(
      '/events-edit/a',
    );
    expect(document.activeElement?.textContent).toBe('Events');
  });

  it('should delete an event only after the admin confirms', async () => {
    await create();
    dialog.open.mockReturnValueOnce({ afterClosed: () => of(false) });
    element.querySelector<HTMLButtonElement>('[aria-label="Delete Item a"]')?.click();
    expect(dialog.open).toHaveBeenCalledWith(ConfirmDelete, { data: { name: 'Item a' } });
    expect(store.remove).not.toHaveBeenCalled();

    dialog.open.mockReturnValueOnce({ afterClosed: () => of(true) });
    element.querySelector<HTMLButtonElement>('[aria-label="Delete Item a"]')?.click();
    await fixture.whenStable();
    expect(store.remove).toHaveBeenCalledWith(store.allEvents()[0]);
    expect(snackBar.open).toHaveBeenCalledWith('Deleted "Item a".', 'Dismiss', {
      duration: 5000,
    });
  });

  it('should show an empty state, and errors', async () => {
    store.allEvents.set([]);
    await create();
    expect(element.textContent).toContain('No events yet.');

    store.error.set('The events could not be loaded. Please try again.');
    await fixture.whenStable();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('could not be loaded');
  });
});
