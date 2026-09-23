import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MediaAdd } from './media-add';

describe('MediaAdd', () => {
  let component: MediaAdd;
  let fixture: ComponentFixture<MediaAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaAdd],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaAdd);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
