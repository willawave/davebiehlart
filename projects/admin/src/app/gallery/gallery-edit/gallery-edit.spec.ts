import { Component, input, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { GalleryDocument, GalleryStyle } from 'core';
import { Timestamp } from 'firebase/firestore';
import { GalleryForm } from '../gallery-form/gallery-form';
import { GalleryFormValue } from '../gallery.service';
import { GalleryStore } from '../gallery.store';
import { GalleryEdit } from './gallery-edit';

@Component({ selector: 'app-gallery-form', template: '' })
class FakeForm {
  readonly storageKey = input<string>();
  readonly initial = input<GalleryFormValue>();
  readonly saving = input(false);
  readonly saved = output<GalleryFormValue>();
  readonly cancelled = output<void>();
  readonly uploaded = output<string[]>();
}

const ITEM: GalleryDocument = {
  id: 'abc',
  created: Timestamp.fromDate(new Date('2024-01-01T00:00:00Z')),
  depth: 1,
  description: 'd',
  height: 1,
  imageUrls: ['old-1.jpg', 'old-2.jpg'],
  name: 'Mustang',
  storageKey: 'key-abc',
  style: GalleryStyle.BRONZE,
  visible: true,
  weight: null,
  width: 1,
};

describe('GalleryEdit', () => {
  const store = {
    error: signal<string | null>(null),
    loading: signal(false),
    selectedGalleryItem: signal<GalleryDocument | null>(null),
    selectedFormValue: signal<GalleryFormValue | null>(null),
    newStorageKey: vi.fn(() => 'fallback-key'),
    clearError: vi.fn(),
    loadOne: vi.fn(() => Promise.resolve(true)),
    update: vi.fn(() => Promise.resolve(true)),
    discardImages: vi.fn(() => Promise.resolve()),
  };
  const snackBar = { open: vi.fn() };
  // Page cleanup waits on the save's outcome, so it lands a tick after destroy.
  const settle = () => new Promise((resolve) => setTimeout(resolve));

  function create() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: GalleryStore, useValue: store },
        { provide: MatSnackBar, useValue: snackBar },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'abc' }) } },
        },
      ],
    });
    TestBed.overrideComponent(GalleryEdit, {
      remove: { imports: [GalleryForm] },
      add: { imports: [FakeForm] },
    });
    const fixture = TestBed.createComponent(GalleryEdit);
    const element: HTMLElement = fixture.nativeElement;
    const form = () =>
      fixture.debugElement.query((el) => el.name === 'app-gallery-form')
        ?.componentInstance as FakeForm;
    return { fixture, element, form };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    store.error.set(null);
    store.loading.set(false);
    store.selectedGalleryItem.set(ITEM);
    store.update.mockResolvedValue(true);
  });

  it('should load the item and edit it in its own photo folder', async () => {
    const { fixture, form } = create();
    await fixture.whenStable();
    expect(store.loadOne).toHaveBeenCalledWith('abc');
    expect(form().storageKey()).toBe('key-abc');
  });

  it('should give a legacy item without a storage key a new folder', async () => {
    store.selectedGalleryItem.set({ ...ITEM, storageKey: '' });
    const { fixture, form } = create();
    await fixture.whenStable();
    expect(form().storageKey()).toBe('fallback-key');
  });

  it('should save, then delete the photos it no longer uses, old and new', async () => {
    const { fixture, form } = create();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();
    const value = { name: 'Mustang', imageUrls: ['old-2.jpg', 'new-1.jpg'] } as GalleryFormValue;

    form().uploaded.emit(['new-1.jpg', 'new-2.jpg']);
    form().saved.emit(value);
    await fixture.whenStable();

    expect(store.update).toHaveBeenCalledWith('abc', value, 'key-abc');
    expect(store.discardImages).toHaveBeenCalledWith(['old-1.jpg', 'new-2.jpg'], 'key-abc');
    expect(navigate).toHaveBeenCalledWith(['/gallery']);
    fixture.destroy();
    await settle();
    expect(store.discardImages).toHaveBeenCalledOnce();
  });

  it("should delete only this page's uploads when leaving without saving", async () => {
    const { fixture, form } = create();
    await fixture.whenStable();
    form().uploaded.emit(['new-1.jpg']);
    fixture.destroy();
    await settle();
    expect(store.discardImages).toHaveBeenCalledWith(['new-1.jpg'], 'key-abc');
  });

  describe('leaving while a save is in flight', () => {
    let finishSave: (saved: boolean) => void;
    const value = { name: 'Mustang', imageUrls: ['old-2.jpg', 'new-1.jpg'] } as GalleryFormValue;

    async function leaveMidSave() {
      store.update.mockReturnValue(new Promise<boolean>((resolve) => (finishSave = resolve)));
      const { fixture, form } = create();
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      await fixture.whenStable();
      form().uploaded.emit(['new-1.jpg', 'new-2.jpg']);
      form().saved.emit(value);
      fixture.destroy();
      return navigate;
    }

    it('should wait, then delete only what the landed save dropped', async () => {
      const navigate = await leaveMidSave();
      await settle();
      expect(store.discardImages).not.toHaveBeenCalled();

      finishSave(true);
      await settle();
      expect(store.discardImages).toHaveBeenCalledOnce();
      expect(store.discardImages).toHaveBeenCalledWith(['old-1.jpg', 'new-2.jpg'], 'key-abc');
      expect(navigate).not.toHaveBeenCalled();
    });

    it("should delete this page's uploads, never the saved photos, once the save fails", async () => {
      await leaveMidSave();
      finishSave(false);
      await settle();
      expect(store.discardImages).toHaveBeenCalledOnce();
      expect(store.discardImages).toHaveBeenCalledWith(['new-1.jpg', 'new-2.jpg'], 'key-abc');
    });
  });

  it('should say so when the item does not exist', async () => {
    store.selectedGalleryItem.set(null);
    const { fixture, element } = create();
    await fixture.whenStable();
    expect(element.textContent).toContain("doesn't exist");
    expect(element.querySelector('app-gallery-form')).toBeNull();
  });
});
