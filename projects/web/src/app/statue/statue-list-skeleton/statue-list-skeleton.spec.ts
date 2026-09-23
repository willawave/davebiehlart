import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatueListSkeleton } from './statue-list-skeleton';

describe('StatueListSkeleton', () => {
  let component: StatueListSkeleton;
  let fixture: ComponentFixture<StatueListSkeleton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatueListSkeleton],
    }).compileComponents();

    fixture = TestBed.createComponent(StatueListSkeleton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
