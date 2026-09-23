import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GlassDetail } from './glass-detail';

describe('GlassDetail', () => {
  let component: GlassDetail;
  let fixture: ComponentFixture<GlassDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlassDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(GlassDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
