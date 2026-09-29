import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { GalleryDocument, GalleryStyle } from 'core';
import { Timestamp } from 'firebase/firestore';
import { of } from 'rxjs';
import { GalleryStore } from '../gallery.store';
import { ConfirmDelete, GalleryTable } from './gallery-table';

const item = (id: string, overrides: Partial<GalleryDocument> = {}): GalleryDocument => ({
  id,
  created: Timestamp.fromDate(new Date('2024-03-14T12:00:00Z')),
  depth: 1,
  description: 'd',
  height: 1,
  imageUrls: [`${id}.jpg`],
  name: `Item ${id}`,
  storageKey: `key-${id}`,
  style: GalleryStyle.BRONZE,
  visible: true,
  weight: null,
  width: 1,
  ...overrides,
});

describe('GalleryTable', () => {
  let fixture: ComponentFixture<GalleryTable>;
  let element: HTMLElement;
  const store = {
    allGalleryItems: signal<GalleryDocument[]>([]),
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
        { provide: GalleryStore, useValue: store },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    fixture = TestBed.createComponent(GalleryTable);
    element = fixture.nativeElement;
    await fixture.whenStable();
  }

  beforeEach(() => {
    vi.clearAllMocks();
    store.allGalleryItems.set([
      item('a'),
      item('b', { style: GalleryStyle.GLASS, visible: false, imageUrls: [] }),
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
    expect(rows[0].textContent).toContain('Bronze');
    expect(rows[0].textContent).toContain('Visible');
    expect(rows[0].textContent).toContain('Mar 14, 2024');
    expect(rows[1].textContent).toContain('Glass');
    expect(rows[1].textContent).toContain('Hidden');
    expect(rows[1].querySelector('img')).toBeNull();
    expect(rows[0].querySelector('a[aria-label="Edit Item a"]')?.getAttribute('href')).toBe(
      '/gallery-edit/a',
    );
    expect(document.activeElement?.textContent).toBe('Gallery');
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
    expect(store.remove).toHaveBeenCalledWith(store.allGalleryItems()[0]);
    expect(snackBar.open).toHaveBeenCalledWith('Deleted "Item a".', 'Dismiss', {
      duration: 5000,
    });
  });

  it('should show an empty state, and errors', async () => {
    store.allGalleryItems.set([]);
    await create();
    expect(element.textContent).toContain('No gallery items yet.');

    store.error.set('The gallery could not be loaded. Please try again.');
    await fixture.whenStable();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('could not be loaded');
  });
});
