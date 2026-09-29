import { Component, input, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, provideRouter } from '@angular/router';
import { MediaDocument } from 'core';
import { MediaForm } from '../media-form/media-form';
import { MediaFormValue } from '../media.service';
import { MediaStore } from '../media.store';
import { MediaAdd } from './media-add';

@Component({ selector: 'app-media-form', template: '' })
class FakeForm {
  readonly initial = input<MediaFormValue>();
  readonly otherLinks = input<readonly string[]>([]);
  readonly saving = input(false);
  readonly saved = output<MediaFormValue>();
  readonly cancelled = output<void>();
}

describe('MediaAdd', () => {
  const store = {
    allMediaItems: signal<MediaDocument[]>([]),
    error: signal<string | null>(null),
    loading: signal(false),
    clearError: vi.fn(),
    loadAll: vi.fn(() => Promise.resolve(true)),
    add: vi.fn(() => Promise.resolve(true)),
  };
  const snackBar = { open: vi.fn() };
  const value = { title: ' In the Studio ' } as MediaFormValue;

  function create() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: MediaStore, useValue: store },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    TestBed.overrideComponent(MediaAdd, {
      remove: { imports: [MediaForm] },
      add: { imports: [FakeForm] },
    });
    const fixture = TestBed.createComponent(MediaAdd);
    const form = fixture.debugElement.children[0].query((el) => el.name === 'app-media-form');
    return { fixture, form: () => form.componentInstance as FakeForm };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    store.add.mockResolvedValue(true);
    store.error.set(null);
    store.allMediaItems.set([]);
  });

  it('should clear old errors, focus the heading, and load the links to check against', async () => {
    const { fixture } = create();
    await fixture.whenStable();
    expect(document.activeElement?.textContent).toBe('Add media');
    expect(store.clearError).toHaveBeenCalled();
    expect(store.loadAll).toHaveBeenCalled();
  });

  it('should hand every existing link to the form', async () => {
    store.allMediaItems.set([{ id: 'a', link: 'https://example.test/a' } as MediaDocument]);
    const { fixture, form } = create();
    await fixture.whenStable();
    expect(store.loadAll).not.toHaveBeenCalled();
    expect(form().otherLinks()).toEqual(['https://example.test/a']);
  });

  it('should save and return to the table', async () => {
    const { fixture, form } = create();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();

    form().saved.emit(value);
    await fixture.whenStable();

    expect(store.add).toHaveBeenCalledWith(value);
    expect(snackBar.open).toHaveBeenCalledWith('Added "In the Studio".', 'Dismiss', {
      duration: 5000,
    });
    expect(navigate).toHaveBeenCalledWith(['/media']);
  });

  it('should stay on the page, showing the error, when the save fails', async () => {
    store.add.mockResolvedValue(false);
    const { fixture, form } = create();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();

    form().saved.emit(value);
    store.error.set('The media item could not be saved. Please try again.');
    await fixture.whenStable();

    expect(navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'could not be saved',
    );
  });

  it('should return to the table on cancel', async () => {
    const { fixture, form } = create();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();
    form().cancelled.emit();
    expect(navigate).toHaveBeenCalledWith(['/media']);
  });
});
