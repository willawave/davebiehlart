import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GalleryForm } from './gallery-form';

describe('GalleryForm', () => {
  let component: GalleryForm;
  let fixture: ComponentFixture<GalleryForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalleryForm],
    }).compileComponents();

    fixture = TestBed.createComponent(GalleryForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
