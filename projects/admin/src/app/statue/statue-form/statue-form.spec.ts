import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatueForm } from './statue-form';

describe('StatueForm', () => {
  let component: StatueForm;
  let fixture: ComponentFixture<StatueForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatueForm],
    }).compileComponents();

    fixture = TestBed.createComponent(StatueForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
