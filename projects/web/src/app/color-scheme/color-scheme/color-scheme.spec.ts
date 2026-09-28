import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ColorSchemeService } from '../color-scheme.service';
import { ColorScheme } from './color-scheme';

describe('ColorScheme', () => {
  let fixture: ComponentFixture<ColorScheme>;
  let isLightMode: ReturnType<typeof signal<boolean>>;
  let toggle: ReturnType<typeof vi.fn>;

  function button(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button');
  }

  beforeEach(async () => {
    isLightMode = signal(true);
    toggle = vi.fn(() => isLightMode.update((light) => !light));
    await TestBed.configureTestingModule({
      imports: [ColorScheme],
      providers: [{ provide: ColorSchemeService, useValue: { isLightMode, toggle } }],
    }).compileComponents();

    fixture = TestBed.createComponent(ColorScheme);
    await fixture.whenStable();
  });

  it('should offer dark mode while in light mode', () => {
    expect(button().getAttribute('aria-label')).toBe('Switch to dark mode');
    expect(button().textContent?.trim()).toBe('dark_mode');
  });

  it('should toggle the scheme and relabel itself on click', async () => {
    button().click();
    await fixture.whenStable();
    expect(toggle).toHaveBeenCalledOnce();
    expect(button().getAttribute('aria-label')).toBe('Switch to light mode');
    expect(button().textContent?.trim()).toBe('light_mode');
  });
});
