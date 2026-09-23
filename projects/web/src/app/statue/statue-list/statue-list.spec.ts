import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatueList } from './statue-list';

describe('StatueList', () => {
  let component: StatueList;
  let fixture: ComponentFixture<StatueList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatueList],
    }).compileComponents();

    fixture = TestBed.createComponent(StatueList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
