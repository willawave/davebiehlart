import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TermsOfUsePage } from './terms-of-use-page';

describe('TermsOfUsePage', () => {
  let component: TermsOfUsePage;
  let fixture: ComponentFixture<TermsOfUsePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermsOfUsePage],
    }).compileComponents();

    fixture = TestBed.createComponent(TermsOfUsePage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
