import { Component, input, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, provideRouter } from '@angular/router';
import { StatueForm } from '../statue-form/statue-form';
import { StatueFormValue } from '../statue.service';
import { StatueStore } from '../statue.store';
import { StatueAdd } from './statue-add';

@Component({ selector: 'app-statue-form', template: '' })
class FakeForm {
  readonly storageKey = input<string>();
  readonly initial = input<StatueFormValue>();
  readonly saving = input(false);
  readonly saved = output<StatueFormValue>();
  readonly cancelled = output<void>();
  readonly uploaded = output<string[]>();
}

describe('StatueAdd', () => {
  const store = {
    error: signal<string | null>(null),
    loading: signal(false),
    newStorageKey: vi.fn(() => 'new-key'),
    clearError: vi.fn(),
    add: vi.fn(() => Promise.resolve(true)),
    discardImages: vi.fn(() => Promise.resolve()),
  };
  const snackBar = { open: vi.fn() };
  const value = { name: ' Mustang ', imageUrls: ['kept.jpg'] } as StatueFormValue;
  // Page cleanup waits on the save's outcome, so it lands a tick after destroy.
  const settle = () => new Promise((resolve) => setTimeout(resolve));

  function create() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: StatueStore, useValue: store },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    TestBed.overrideComponent(StatueAdd, {
      remove: { imports: [StatueForm] },
      add: { imports: [FakeForm] },
    });
    const fixture = TestBed.createComponent(StatueAdd);
    const form = fixture.debugElement.children[0].query((el) => el.name === 'app-statue-form');
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
    expect(document.activeElement?.textContent).toBe('Add statue');
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
    expect(navigate).toHaveBeenCalledWith(['/statues']);

    fixture.destroy();
    await settle();
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

  describe('leaving while a save is in flight', () => {
    let finishSave: (saved: boolean) => void;

    function leaveMidSave() {
      store.add.mockReturnValue(new Promise<boolean>((resolve) => (finishSave = resolve)));
      const { fixture, form } = create();
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      form().uploaded.emit(['kept.jpg', 'dropped.jpg']);
      form().saved.emit(value);
      fixture.destroy();
      return navigate;
    }

    it('should keep the photos a landed save uses, without pulling the admin back', async () => {
      const navigate = leaveMidSave();
      await settle();
      expect(store.discardImages).not.toHaveBeenCalled();

      finishSave(true);
      await settle();
      expect(store.discardImages).toHaveBeenCalledOnce();
      expect(store.discardImages).toHaveBeenCalledWith(['dropped.jpg'], 'new-key');
      expect(navigate).not.toHaveBeenCalled();
    });

    it('should delete every upload once the save fails', async () => {
      leaveMidSave();
      finishSave(false);
      await settle();
      expect(store.discardImages).toHaveBeenCalledOnce();
      expect(store.discardImages).toHaveBeenCalledWith(['kept.jpg', 'dropped.jpg'], 'new-key');
    });
  });

  it('should delete every upload when the admin leaves without saving', async () => {
    const { fixture, form } = create();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    form().uploaded.emit(['a.jpg']);
    form().uploaded.emit(['b.jpg']);
    form().cancelled.emit();

    fixture.destroy();
    await settle();
    expect(store.discardImages).toHaveBeenCalledWith(['a.jpg', 'b.jpg'], 'new-key');
  });
});
