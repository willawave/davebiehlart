import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ColorScheme } from './color-scheme';

describe('ColorScheme', () => {
  let component: ColorScheme;
  let fixture: ComponentFixture<ColorScheme>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColorScheme],
    }).compileComponents();

    fixture = TestBed.createComponent(ColorScheme);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
