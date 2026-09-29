import { Component, input, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { MediaDocument } from 'core';
import { Timestamp } from 'firebase/firestore';
import { MediaForm } from '../media-form/media-form';
import { MediaFormValue, toMediaFormValue } from '../media.service';
import { MediaStore } from '../media.store';
import { MediaEdit } from './media-edit';

@Component({ selector: 'app-media-form', template: '' })
class FakeForm {
  readonly initial = input<MediaFormValue>();
  readonly otherLinks = input<readonly string[]>([]);
  readonly saving = input(false);
  readonly saved = output<MediaFormValue>();
  readonly cancelled = output<void>();
}

const ITEM: MediaDocument = {
  id: 'abc',
  date: Timestamp.fromDate(new Date('2026-09-12T05:00:00Z')),
  description: 'd',
  link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  title: 'In the Studio',
  visible: true,
};

describe('MediaEdit', () => {
  const store = {
    allMediaItems: signal<MediaDocument[]>([]),
    error: signal<string | null>(null),
    loading: signal(false),
    selectedMediaItem: signal<MediaDocument | null>(null),
    selectedFormValue: signal<MediaFormValue | null>(null),
    clearError: vi.fn(),
    loadAll: vi.fn(() => Promise.resolve(true)),
    loadOne: vi.fn(() => Promise.resolve(true)),
    update: vi.fn(() => Promise.resolve(true)),
  };
  const snackBar = { open: vi.fn() };

  function create() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: MediaStore, useValue: store },
        { provide: MatSnackBar, useValue: snackBar },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'abc' }) } },
        },
      ],
    });
    TestBed.overrideComponent(MediaEdit, {
      remove: { imports: [MediaForm] },
      add: { imports: [FakeForm] },
    });
    const fixture = TestBed.createComponent(MediaEdit);
    const element: HTMLElement = fixture.nativeElement;
    const form = () =>
      fixture.debugElement.query((el) => el.name === 'app-media-form')?.componentInstance as
        FakeForm | undefined;
    return { fixture, element, form };
  }

  function select(item: MediaDocument | null) {
    store.selectedMediaItem.set(item);
    store.selectedFormValue.set(item ? toMediaFormValue(item) : null);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    store.error.set(null);
    store.loading.set(false);
    store.update.mockResolvedValue(true);
    store.allMediaItems.set([]);
    select(null);
  });

  it('should load the list, then the item, and hand it to the form', async () => {
    select(ITEM);
    const { fixture, form } = create();
    await fixture.whenStable();

    expect(store.loadAll).toHaveBeenCalled();
    expect(store.loadOne).toHaveBeenCalledWith('abc');
    expect(store.loadAll.mock.invocationCallOrder[0]).toBeLessThan(
      store.loadOne.mock.invocationCallOrder[0],
    );
    expect(form()?.initial()?.title).toBe('In the Studio');
    expect(document.activeElement?.textContent).toBe('Edit media');
  });

  it("should check against every link but the item's own", async () => {
    select(ITEM);
    store.allMediaItems.set([ITEM, { ...ITEM, id: 'other', link: 'https://example.test/a' }]);
    const { fixture, form } = create();
    await fixture.whenStable();
    expect(form()?.otherLinks()).toEqual(['https://example.test/a']);
  });

  it('should say when the item does not exist', async () => {
    const { fixture, element } = create();
    await fixture.whenStable();
    expect(element.textContent).toContain("This media item doesn't exist.");
  });

  it('should save and return to the table', async () => {
    select(ITEM);
    const { fixture, form } = create();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();

    const value = { ...toMediaFormValue(ITEM), title: ' On Air ' };
    form()?.saved.emit(value);
    await fixture.whenStable();

    expect(store.update).toHaveBeenCalledWith('abc', value);
    expect(snackBar.open).toHaveBeenCalledWith('Saved "On Air".', 'Dismiss', { duration: 5000 });
    expect(navigate).toHaveBeenCalledWith(['/media']);
  });

  it('should stay on the page when the save fails', async () => {
    select(ITEM);
    store.update.mockResolvedValue(false);
    const { fixture, form } = create();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();

    form()?.saved.emit(toMediaFormValue(ITEM));
    await fixture.whenStable();

    expect(navigate).not.toHaveBeenCalled();
    expect(snackBar.open).not.toHaveBeenCalled();
  });
});
