import { Component, input, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, provideRouter } from '@angular/router';
import { GalleryForm } from '../gallery-form/gallery-form';
import { GalleryFormValue } from '../gallery.service';
import { GalleryStore } from '../gallery.store';
import { GalleryAdd } from './gallery-add';

@Component({ selector: 'app-gallery-form', template: '' })
class FakeForm {
  readonly storageKey = input<string>();
  readonly initial = input<GalleryFormValue>();
  readonly saving = input(false);
  readonly saved = output<GalleryFormValue>();
  readonly cancelled = output<void>();
  readonly uploaded = output<string[]>();
}

describe('GalleryAdd', () => {
  const store = {
    error: signal<string | null>(null),
    loading: signal(false),
    newStorageKey: vi.fn(() => 'new-key'),
    clearError: vi.fn(),
    add: vi.fn(() => Promise.resolve(true)),
    discardImages: vi.fn(() => Promise.resolve()),
  };
  const snackBar = { open: vi.fn() };
  const value = { name: ' Mustang ', imageUrls: ['kept.jpg'] } as GalleryFormValue;

  function create() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: GalleryStore, useValue: store },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    TestBed.overrideComponent(GalleryAdd, {
      remove: { imports: [GalleryForm] },
      add: { imports: [FakeForm] },
    });
    const fixture = TestBed.createComponent(GalleryAdd);
    const form = fixture.debugElement.children[0].query((el) => el.name === 'app-gallery-form');
    return { fixture, form: () => form.componentInstance as FakeForm };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    store.add.mockResolvedValue(true);
  });

  it('should give the form a new storage key and focus the heading', async () => {
    const { fixture, form } = create();
    await fixture.whenStable();
    expect(form().storageKey()).toBe('new-key');
    expect(document.activeElement?.textContent).toBe('Add gallery item');
    expect(store.clearError).toHaveBeenCalled();
  });

  it('should save, delete uploads the item does not keep, and return to the table', async () => {
    const { fixture, form } = create();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();

    form().uploaded.emit(['kept.jpg', 'dropped.jpg']);
    form().saved.emit(value);
    await fixture.whenStable();

    expect(store.add).toHaveBeenCalledWith(value, 'new-key');
    expect(store.discardImages).toHaveBeenCalledWith(['dropped.jpg'], 'new-key');
    expect(snackBar.open).toHaveBeenCalledWith('Added "Mustang".', 'Dismiss', { duration: 5000 });
    expect(navigate).toHaveBeenCalledWith(['/gallery']);

    fixture.destroy();
    expect(store.discardImages).toHaveBeenCalledOnce();
  });

  it('should stay put, keeping uploads, when the save fails', async () => {
    store.add.mockResolvedValue(false);
    const { fixture, form } = create();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
    form().uploaded.emit(['a.jpg']);
    form().saved.emit(value);
    await fixture.whenStable();

    expect(navigate).not.toHaveBeenCalled();
    expect(store.discardImages).not.toHaveBeenCalled();
  });

  it('should delete every upload when the admin leaves without saving', async () => {
    const { fixture, form } = create();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    form().uploaded.emit(['a.jpg']);
    form().uploaded.emit(['b.jpg']);
    form().cancelled.emit();

    fixture.destroy();
    expect(store.discardImages).toHaveBeenCalledWith(['a.jpg', 'b.jpg'], 'new-key');
  });
});
