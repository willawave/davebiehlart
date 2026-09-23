import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MediaEdit } from './media-edit';

describe('MediaEdit', () => {
  let component: MediaEdit;
  let fixture: ComponentFixture<MediaEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaEdit],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
