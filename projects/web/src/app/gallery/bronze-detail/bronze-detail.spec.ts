import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BronzeDetail } from './bronze-detail';

describe('BronzeDetail', () => {
  let component: BronzeDetail;
  let fixture: ComponentFixture<BronzeDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BronzeDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(BronzeDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
