import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PhotoField } from './photo-field';

describe('PhotoField', () => {
  let fixture: ComponentFixture<PhotoField>;
  let element: HTMLElement;
  const picked = vi.fn();

  async function create(images = ['a.jpg', 'b.jpg', 'c.jpg']) {
    fixture = TestBed.createComponent(PhotoField);
    fixture.componentRef.setInput('images', images);
    fixture.componentInstance.filesPicked.subscribe(picked);
    element = fixture.nativeElement;
    // Focus moves by document id, so the field must be in the document.
    document.body.appendChild(element);
    await fixture.whenStable();
  }

  const button = (label: string) =>
    Array.from(element.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === label || b.getAttribute('aria-label') === label,
    ) as HTMLButtonElement;
  const photos = () =>
    Array.from(element.querySelectorAll('.photos img'), (img) => img.getAttribute('src'));

  function pick(...files: File[]) {
    const input = element.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error('no file input');
    Object.defineProperty(input, 'files', { value: files, configurable: true });
    input.dispatchEvent(new Event('change'));
  }

  beforeEach(() => vi.clearAllMocks());
  afterEach(() => element.remove());

  it('should move a photo and keep focus on the button that moved it', async () => {
    await create();
    button('Move photo 2 right').click();
    await fixture.whenStable();

    expect(photos()).toEqual(['a.jpg', 'c.jpg', 'b.jpg']);
    expect(fixture.componentInstance.images()).toEqual(['a.jpg', 'c.jpg', 'b.jpg']);
    // Photo 3 reached the end, so focus moves to its other arrow.
    expect(document.activeElement?.id).toBe('photo-2-move-left');
  });

  it('should focus the next photo after a removal, and the upload button after the last', async () => {
    await create(['a.jpg']);
    button('Remove photo 1').click();
    await fixture.whenStable();

    expect(photos()).toEqual([]);
    expect(document.activeElement?.id).toBe('upload');
  });

  it('should hand over accepted files and explain the rest', async () => {
    await create();
    const ok = new File(['x'], 'ok.jpg', { type: 'image/jpeg' });
    pick(new File(['x'], 'logo.svg', { type: 'image/svg+xml' }), ok);
    await fixture.whenStable();

    expect(picked).toHaveBeenCalledWith([ok]);
    expect(element.textContent).toContain('logo.svg is not a JPEG, PNG, WebP, GIF or AVIF image.');
  });

  it('should not report a pick with nothing usable', async () => {
    await create();
    pick(new File(['x'], 'notes.txt', { type: 'text/plain' }));
    await fixture.whenStable();
    expect(picked).not.toHaveBeenCalled();
  });

  it('should show the upload count and the list error, and lock while disabled', async () => {
    await create();
    fixture.componentRef.setInput('uploading', 2);
    fixture.componentRef.setInput('error', 'Upload at least one photo.');
    await fixture.whenStable();
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Uploading 2 photos…');
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Upload at least one photo.',
    );
    expect(button('Upload photos').disabled).toBe(true);

    fixture.componentRef.setInput('uploading', 0);
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    const all = Array.from(element.querySelectorAll<HTMLButtonElement>('button'));
    expect(all.every((b) => b.disabled)).toBe(true);
  });
});
