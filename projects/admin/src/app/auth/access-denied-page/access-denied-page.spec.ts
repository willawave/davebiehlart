import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccessDeniedPage } from './access-denied-page';

describe('AccessDeniedPage', () => {
  let component: AccessDeniedPage;
  let fixture: ComponentFixture<AccessDeniedPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessDeniedPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AccessDeniedPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
