import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatueTable } from './statue-table';

describe('StatueTable', () => {
  let component: StatueTable;
  let fixture: ComponentFixture<StatueTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatueTable],
    }).compileComponents();

    fixture = TestBed.createComponent(StatueTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
