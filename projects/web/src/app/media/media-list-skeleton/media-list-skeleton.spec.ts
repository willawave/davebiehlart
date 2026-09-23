import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MediaListSkeleton } from './media-list-skeleton';

describe('MediaListSkeleton', () => {
  let component: MediaListSkeleton;
  let fixture: ComponentFixture<MediaListSkeleton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaListSkeleton],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaListSkeleton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
