import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GalleryEdit } from './gallery-edit';

describe('GalleryEdit', () => {
  let component: GalleryEdit;
  let fixture: ComponentFixture<GalleryEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalleryEdit],
    }).compileComponents();

    fixture = TestBed.createComponent(GalleryEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
