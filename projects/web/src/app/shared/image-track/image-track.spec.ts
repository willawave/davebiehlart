import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageTrack } from './image-track';

describe('ImageTrack', () => {
  let component: ImageTrack;
  let fixture: ComponentFixture<ImageTrack>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageTrack],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageTrack);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
