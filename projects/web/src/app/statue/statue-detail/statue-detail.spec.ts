import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatueDetail } from './statue-detail';

describe('StatueDetail', () => {
  let component: StatueDetail;
  let fixture: ComponentFixture<StatueDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatueDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(StatueDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
