import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatueAdd } from './statue-add';

describe('StatueAdd', () => {
  let component: StatueAdd;
  let fixture: ComponentFixture<StatueAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatueAdd],
    }).compileComponents();

    fixture = TestBed.createComponent(StatueAdd);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
