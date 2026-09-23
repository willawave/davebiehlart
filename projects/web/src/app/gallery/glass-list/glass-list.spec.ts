import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GlassList } from './glass-list';

describe('GlassList', () => {
  let component: GlassList;
  let fixture: ComponentFixture<GlassList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlassList],
    }).compileComponents();

    fixture = TestBed.createComponent(GlassList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
