import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatueEdit } from './statue-edit';

describe('StatueEdit', () => {
  let component: StatueEdit;
  let fixture: ComponentFixture<StatueEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatueEdit],
    }).compileComponents();

    fixture = TestBed.createComponent(StatueEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
