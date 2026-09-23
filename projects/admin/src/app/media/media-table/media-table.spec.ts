import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MediaTable } from './media-table';

describe('MediaTable', () => {
  let component: MediaTable;
  let fixture: ComponentFixture<MediaTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaTable],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
