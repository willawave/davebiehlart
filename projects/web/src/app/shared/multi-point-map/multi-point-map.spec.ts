import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MultiPointMap } from './multi-point-map';

describe('MultiPointMap', () => {
  let component: MultiPointMap;
  let fixture: ComponentFixture<MultiPointMap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiPointMap],
    }).compileComponents();

    fixture = TestBed.createComponent(MultiPointMap);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
