import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GalleryAdd } from './gallery-add';

describe('GalleryAdd', () => {
  let component: GalleryAdd;
  let fixture: ComponentFixture<GalleryAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalleryAdd],
    }).compileComponents();

    fixture = TestBed.createComponent(GalleryAdd);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
