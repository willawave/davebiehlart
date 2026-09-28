import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ImageDialog } from '../image-dialog/image-dialog';
import { ImageTrack } from './image-track';

describe('ImageTrack', () => {
  let fixture: ComponentFixture<ImageTrack>;
  let element: HTMLElement;
  const dialog = { open: vi.fn() };

  async function render(images: string[]) {
    fixture.componentRef.setInput('images', images);
    fixture.componentRef.setInput('alt', 'Mustang');
    await fixture.whenStable();
  }

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: MatDialog, useValue: dialog }] });
    fixture = TestBed.createComponent(ImageTrack);
    element = fixture.nativeElement;
  });

  it('should number each photo in its alt text and lazy-load all but the first', async () => {
    await render(['a.jpg', 'b.jpg', 'c.jpg']);

    const images = Array.from(element.querySelectorAll('img'));
    expect(images.map((img) => img.alt)).toEqual([
      'Mustang, photo 1 of 3',
      'Mustang, photo 2 of 3',
      'Mustang, photo 3 of 3',
    ]);
    expect(images.map((img) => img.getAttribute('loading'))).toEqual([null, 'lazy', 'lazy']);
  });

  it('should open the tapped photo full size', async () => {
    await render(['a.jpg', 'b.jpg']);

    element.querySelectorAll<HTMLButtonElement>('button.photo')[1].click();

    expect(dialog.open).toHaveBeenCalledWith(
      ImageDialog,
      expect.objectContaining({
        data: {
          images: ['a.jpg', 'b.jpg'],
          altTexts: ['Mustang, photo 1 of 2', 'Mustang, photo 2 of 2'],
          index: 1,
        },
        ariaLabel: 'Mustang',
      }),
    );
  });

  it('should scroll the strip with the arrow buttons, disabling each at its end', async () => {
    await render(['a.jpg', 'b.jpg']);
    const track = element.querySelector<HTMLElement>('.track');
    if (!track) throw new Error('no track');
    // jsdom has no layout: fake a strip twice as wide as its window, scrolled to the start.
    Object.defineProperty(track, 'scrollWidth', { value: 800 });
    Object.defineProperty(track, 'clientWidth', { value: 400 });
    track.scrollBy = vi.fn();
    track.dispatchEvent(new Event('scroll'));
    await fixture.whenStable();

    const back = element.querySelector<HTMLButtonElement>('[aria-label="Scroll photos back"]');
    const forward = element.querySelector<HTMLButtonElement>(
      '[aria-label="Scroll photos forward"]',
    );
    expect(back?.disabled).toBe(true);
    expect(forward?.disabled).toBe(false);

    forward?.click();
    expect(track.scrollBy).toHaveBeenCalledWith({ left: 320, behavior: 'smooth' });
  });

  it('should show one photo by its name alone, without arrows', async () => {
    await render(['a.jpg']);
    expect(element.querySelector('img')?.alt).toBe('Mustang');
    expect(element.querySelector('.controls')).toBeNull();
  });
});
