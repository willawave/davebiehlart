import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SinglePointMap } from './single-point-map';

describe('SinglePointMap', () => {
  let component: SinglePointMap;
  let fixture: ComponentFixture<SinglePointMap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SinglePointMap],
    }).compileComponents();

    fixture = TestBed.createComponent(SinglePointMap);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
