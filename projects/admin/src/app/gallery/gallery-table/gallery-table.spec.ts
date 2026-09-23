import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GalleryTable } from './gallery-table';

describe('GalleryTable', () => {
  let component: GalleryTable;
  let fixture: ComponentFixture<GalleryTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalleryTable],
    }).compileComponents();

    fixture = TestBed.createComponent(GalleryTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
