import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BronzeList } from './bronze-list';

describe('BronzeList', () => {
  let component: BronzeList;
  let fixture: ComponentFixture<BronzeList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BronzeList],
    }).compileComponents();

    fixture = TestBed.createComponent(BronzeList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
