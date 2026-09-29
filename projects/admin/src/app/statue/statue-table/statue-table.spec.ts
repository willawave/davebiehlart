import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { StatueDocument } from 'core';
import { Timestamp } from 'firebase/firestore';
import { of } from 'rxjs';
import { StatueStore } from '../statue.store';
import { ConfirmDelete } from '../../shared/confirm-delete';
import { StatueTable } from './statue-table';

const item = (id: string, overrides: Partial<StatueDocument> = {}): StatueDocument => ({
  id,
  dedicated: Timestamp.fromDate(new Date('2024-03-14T12:00:00Z')),
  description: 'd',
  imageUrls: [`${id}.jpg`],
  location: {
    city: 'Omaha',
    latitude: 41.25,
    longitude: -95.99,
    state: 'Nebraska',
    street: '1 Main St',
    venue: 'Gene Leahy Mall',
  },
  name: `Item ${id}`,
  storageKey: `key-${id}`,
  visible: true,
  ...overrides,
});

describe('StatueTable', () => {
  let fixture: ComponentFixture<StatueTable>;
  let element: HTMLElement;
  const store = {
    allStatueItems: signal<StatueDocument[]>([]),
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
        { provide: StatueStore, useValue: store },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    fixture = TestBed.createComponent(StatueTable);
    element = fixture.nativeElement;
    await fixture.whenStable();
  }

  beforeEach(() => {
    vi.clearAllMocks();
    store.allStatueItems.set([
      item('a'),
      item('b', {
        location: { ...item('b').location, city: 'Council Bluffs', state: 'Iowa' },
        visible: false,
        imageUrls: [],
      }),
    ]);
    store.loading.set(false);
    store.error.set(null);
  });

  it('should load every item and list it with its details and actions', async () => {
    await create();
    expect(store.loadAll).toHaveBeenCalled();

    const rows = element.querySelectorAll('tr[mat-row]');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Item a');
    expect(rows[0].textContent).toContain('Omaha, Nebraska');
    expect(rows[0].textContent).toContain('Visible');
    expect(rows[0].textContent).toContain('Mar 14, 2024');
    expect(rows[1].textContent).toContain('Council Bluffs, Iowa');
    expect(rows[1].textContent).toContain('Hidden');
    expect(rows[1].querySelector('img')).toBeNull();
    expect(rows[0].querySelector('a[aria-label="Edit Item a"]')?.getAttribute('href')).toBe(
      '/statues-edit/a',
    );
    expect(document.activeElement?.textContent).toBe('Statues');
  });

  it('should delete an item only after the admin confirms', async () => {
    await create();
    dialog.open.mockReturnValueOnce({ afterClosed: () => of(false) });
    element.querySelector<HTMLButtonElement>('[aria-label="Delete Item a"]')?.click();
    expect(dialog.open).toHaveBeenCalledWith(ConfirmDelete, { data: { name: 'Item a' } });
    expect(store.remove).not.toHaveBeenCalled();

    dialog.open.mockReturnValueOnce({ afterClosed: () => of(true) });
    element.querySelector<HTMLButtonElement>('[aria-label="Delete Item a"]')?.click();
    await fixture.whenStable();
    expect(store.remove).toHaveBeenCalledWith(store.allStatueItems()[0]);
    expect(snackBar.open).toHaveBeenCalledWith('Deleted "Item a".', 'Dismiss', {
      duration: 5000,
    });
  });

  it('should show an empty state, and errors', async () => {
    store.allStatueItems.set([]);
    await create();
    expect(element.textContent).toContain('No statues yet.');

    store.error.set('The statues could not be loaded. Please try again.');
    await fixture.whenStable();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('could not be loaded');
  });
});
