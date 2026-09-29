import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GalleryStyle } from 'core';
import { GalleryFormValue } from '../gallery.service';
import { GalleryStore } from '../gallery.store';
import { GalleryForm } from './gallery-form';

const VALID: GalleryFormValue = {
  created: new Date('2024-03-14T07:00:00Z'),
  depth: 9,
  description: 'Cast bronze.',
  height: 18,
  imageUrls: ['a.jpg', 'b.jpg', 'c.jpg'],
  name: 'Mustang',
  storageKey: 'key-1',
  style: GalleryStyle.BRONZE,
  visible: true,
  weight: null,
  width: 22,
};

describe('GalleryForm', () => {
  let fixture: ComponentFixture<GalleryForm>;
  let element: HTMLElement;
  const store = {
    uploadImages: vi.fn<(files: File[], key: string) => Promise<string[] | null>>(),
    discardImages: vi.fn(() => Promise.resolve()),
  };
  const saved = vi.fn();
  const uploaded = vi.fn();
  const cancelled = vi.fn();

  async function create(initial?: GalleryFormValue) {
    TestBed.configureTestingModule({ providers: [{ provide: GalleryStore, useValue: store }] });
    fixture = TestBed.createComponent(GalleryForm);
    fixture.componentRef.setInput('storageKey', 'key-1');
    fixture.componentRef.setInput('initial', initial);
    fixture.componentInstance.saved.subscribe(saved);
    fixture.componentInstance.uploaded.subscribe(uploaded);
    fixture.componentInstance.cancelled.subscribe(cancelled);
    element = fixture.nativeElement;
    await fixture.whenStable();
  }

  const button = (label: string) =>
    Array.from(element.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === label || b.getAttribute('aria-label') === label,
    ) as HTMLButtonElement;
  const photos = () =>
    Array.from(element.querySelectorAll('.photos img'), (img) => img.getAttribute('src'));

  async function submit() {
    element.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  }

  async function pick(...files: File[]) {
    const input = element.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error('no file input');
    Object.defineProperty(input, 'files', { value: files, configurable: true });
    input.dispatchEvent(new Event('change'));
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  }

  beforeEach(() => vi.clearAllMocks());

  it('should refuse to save an empty item and say what is missing', async () => {
    await create();
    await submit();

    expect(saved).not.toHaveBeenCalled();
    const text = element.textContent ?? '';
    expect(text).toContain('Enter a name.');
    expect(text).toContain('Choose a style.');
    expect(text).toContain('Enter a height greater than 0.');
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Upload at least one photo.',
    );
  });

  it('should treat a name or description of only spaces as missing', async () => {
    await create({ ...VALID, name: '   ', description: ' \n ' });
    await submit();

    expect(saved).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Enter a name.');
    expect(element.textContent).toContain('Enter a description.');
  });

  it('should save a complete item', async () => {
    await create(VALID);
    await submit();
    expect(saved).toHaveBeenCalledWith(VALID);
  });

  it('should reorder and remove photos, keeping the first as the cover', async () => {
    await create(VALID);
    expect(button('Move photo 1 left').disabled).toBe(true);
    expect(button('Move photo 3 right').disabled).toBe(true);

    button('Move photo 1 right').click();
    await fixture.whenStable();
    expect(photos()).toEqual(['b.jpg', 'a.jpg', 'c.jpg']);
    expect(element.querySelector('.photos img')?.getAttribute('alt')).toBe('Photo 1 (cover)');

    button('Remove photo 3').click();
    await fixture.whenStable();
    expect(photos()).toEqual(['b.jpg', 'a.jpg']);
  });

  it('should upload picked photos to the item folder and add them to the end', async () => {
    store.uploadImages.mockResolvedValue(['new.jpg']);
    await create(VALID);
    const photo = new File(['x'], 'new.jpg', { type: 'image/jpeg' });

    await pick(photo);

    expect(store.uploadImages).toHaveBeenCalledWith([photo], 'key-1');
    expect(uploaded).toHaveBeenCalledWith(['new.jpg']);
    expect(photos()).toEqual(['a.jpg', 'b.jpg', 'c.jpg', 'new.jpg']);
  });

  it('should skip files it cannot accept and say why', async () => {
    store.uploadImages.mockResolvedValue(['ok.jpg']);
    await create(VALID);

    await pick(
      new File(['x'], 'logo.svg', { type: 'image/svg+xml' }),
      new File(['x'], 'ok.jpg', { type: 'image/jpeg' }),
    );

    expect(store.uploadImages).toHaveBeenCalledWith(
      [expect.objectContaining({ name: 'ok.jpg' })],
      'key-1',
    );
    expect(element.textContent).toContain('logo.svg is not a JPEG, PNG, WebP, GIF or AVIF image.');
  });

  it('should keep the photos unchanged when an upload fails', async () => {
    store.uploadImages.mockResolvedValue(null);
    await create(VALID);
    await pick(new File(['x'], 'a.jpg', { type: 'image/jpeg' }));
    expect(uploaded).not.toHaveBeenCalled();
    expect(photos()).toEqual(['a.jpg', 'b.jpg', 'c.jpg']);
  });

  it('should cancel, and disable saving and cancelling while a save is running', async () => {
    await create(VALID);
    button('Cancel').click();
    expect(cancelled).toHaveBeenCalled();

    fixture.componentRef.setInput('saving', true);
    await fixture.whenStable();
    expect(button('Saving…').disabled).toBe(true);
    expect(button('Cancel').disabled).toBe(true);
  });

  it('should lock every field and photo control while a save is running', async () => {
    await create(VALID);
    fixture.componentRef.setInput('saving', true);
    await fixture.whenStable();

    const inputs = Array.from(element.querySelectorAll<HTMLInputElement>('input[matInput]'));
    const textarea = element.querySelector<HTMLTextAreaElement>('textarea');
    expect(inputs.length).toBeGreaterThan(0);
    expect(inputs.every((input) => input.disabled)).toBe(true);
    expect(textarea?.disabled).toBe(true);
    expect(element.querySelector('mat-select')?.getAttribute('aria-disabled')).toBe('true');
    expect(element.querySelector('mat-checkbox input')?.hasAttribute('disabled')).toBe(true);
    expect(button('Upload photos').disabled).toBe(true);
    const photoButtons = Array.from(element.querySelectorAll<HTMLButtonElement>('.photos button'));
    expect(photoButtons.every((b) => b.disabled)).toBe(true);

    // A failed save hands the form back, editable again.
    fixture.componentRef.setInput('saving', false);
    await fixture.whenStable();
    expect(textarea?.disabled).toBe(false);
    expect(button('Remove photo 1').disabled).toBe(false);
  });

  it('should require height, width and depth once they are cleared', async () => {
    await create(VALID);
    // In template order: weight, height, width, depth.
    const [weight, ...dimensions] = Array.from(
      element.querySelectorAll<HTMLInputElement>('input[type="number"]'),
    );
    for (const input of [weight, ...dimensions]) {
      input.value = '';
      input.dispatchEvent(new Event('input'));
    }
    await submit();

    expect(saved).not.toHaveBeenCalled();
    const text = element.textContent ?? '';
    expect(text).toContain('Enter a height.');
    expect(text).toContain('Enter a width.');
    expect(text).toContain('Enter a depth.');
    // Weight stays optional.
    expect(text).not.toContain('Enter a weight');
  });

  it('should delete photos that finish uploading after the form is gone', async () => {
    let finish!: (urls: string[]) => void;
    store.uploadImages.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    await create(VALID);
    const input = element.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error('no file input');
    Object.defineProperty(input, 'files', {
      value: [new File(['x'], 'late.jpg', { type: 'image/jpeg' })],
    });
    input.dispatchEvent(new Event('change'));

    fixture.destroy();
    finish(['late.jpg']);
    await new Promise((resolve) => setTimeout(resolve));

    expect(store.discardImages).toHaveBeenCalledWith(['late.jpg'], 'key-1');
    expect(uploaded).not.toHaveBeenCalled();
  });
});
