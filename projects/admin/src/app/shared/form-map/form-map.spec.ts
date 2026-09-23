import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormMap } from './form-map';

describe('FormMap', () => {
  let component: FormMap;
  let fixture: ComponentFixture<FormMap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormMap],
    }).compileComponents();

    fixture = TestBed.createComponent(FormMap);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
