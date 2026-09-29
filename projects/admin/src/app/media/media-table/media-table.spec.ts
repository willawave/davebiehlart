import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { MediaDocument } from 'core';
import { Timestamp } from 'firebase/firestore';
import { of } from 'rxjs';
import { ConfirmDelete } from '../../shared/confirm-delete';
import { MediaStore } from '../media.store';
import { MediaTable } from './media-table';

const item = (id: string, overrides: Partial<MediaDocument> = {}): MediaDocument => ({
  id,
  // Local noon, so the date reads the same in every time zone.
  date: Timestamp.fromDate(new Date(2024, 2, 14, 12)),
  description: 'd',
  link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  title: `Item ${id}`,
  visible: true,
  ...overrides,
});

describe('MediaTable', () => {
  let fixture: ComponentFixture<MediaTable>;
  let element: HTMLElement;
  const store = {
    allMediaItems: signal<MediaDocument[]>([]),
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
        { provide: MediaStore, useValue: store },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    fixture = TestBed.createComponent(MediaTable);
    element = fixture.nativeElement;
    await fixture.whenStable();
  }

  beforeEach(() => {
    vi.clearAllMocks();
    store.allMediaItems.set([
      item('a'),
      item('b', { link: 'https://www.startribune.com/story', visible: false }),
      item('c', { link: 'https://www.youtube.com/@davebiehl' }),
    ]);
    store.loading.set(false);
    store.error.set(null);
  });

  it('should load every item and list it with its type and actions', async () => {
    await create();
    expect(store.loadAll).toHaveBeenCalled();

    const rows = element.querySelectorAll('tr[mat-row]');
    expect(rows.length).toBe(3);
    expect(rows[0].textContent).toContain('Item a');
    expect(rows[0].textContent).toContain('Mar 14, 2024');
    expect(rows[0].textContent).toContain('Video');
    expect(rows[0].textContent).toContain('Visible');
    expect(rows[1].textContent).toContain('Article · startribune.com');
    expect(rows[1].textContent).toContain('Hidden');
    expect(rows[2].querySelector('.invalid')?.textContent?.trim()).toBe('Invalid link');
    const open = rows[1].querySelector('a[target="_blank"]');
    expect(open?.getAttribute('href')).toBe('https://www.startribune.com/story');
    expect(open?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(rows[0].querySelector('a[aria-label="Edit Item a"]')?.getAttribute('href')).toBe(
      '/media-edit/a',
    );
    expect(document.activeElement?.textContent).toBe('Media');
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
    expect(store.remove).toHaveBeenCalledWith(store.allMediaItems()[0]);
    expect(snackBar.open).toHaveBeenCalledWith('Deleted "Item a".', 'Dismiss', {
      duration: 5000,
    });
  });

  it('should show an empty state, and errors', async () => {
    store.allMediaItems.set([]);
    await create();
    expect(element.textContent).toContain('No media yet.');

    store.error.set('The media items could not be loaded. Please try again.');
    await fixture.whenStable();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('could not be loaded');
  });
});
