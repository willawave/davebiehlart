import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ImageDialog, ImageDialogData } from './image-dialog';

describe('ImageDialog', () => {
  let fixture: ComponentFixture<ImageDialog>;
  let element: HTMLElement;

  function create(data: ImageDialogData) {
    TestBed.configureTestingModule({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    });
    fixture = TestBed.createComponent(ImageDialog);
    element = fixture.nativeElement;
  }

  const shown = () => element.querySelector('img');

  it('should open on the chosen photo and step through the rest, wrapping around', async () => {
    create({ images: ['a.jpg', 'b.jpg', 'c.jpg'], altTexts: ['A', 'B', 'C'], index: 2 });
    await fixture.whenStable();
    expect(shown()?.getAttribute('src')).toBe('c.jpg');
    expect(shown()?.alt).toBe('C');
    expect(element.querySelector('.count')?.textContent?.trim()).toBe('3 / 3');

    element.querySelector<HTMLButtonElement>('[aria-label="Next photo"]')?.click();
    await fixture.whenStable();
    expect(shown()?.getAttribute('src')).toBe('a.jpg');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    await fixture.whenStable();
    expect(shown()?.getAttribute('src')).toBe('c.jpg');
  });

  it('should hide the stepper for a single photo', async () => {
    create({ images: ['a.jpg'], altTexts: ['A'], index: 0 });
    await fixture.whenStable();
    expect(element.querySelector('.nav')).toBeNull();
    expect(element.querySelector('[aria-label="Close"]')).not.toBeNull();
  });
});
