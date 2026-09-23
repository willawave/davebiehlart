import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventAdd } from './event-add';

describe('EventAdd', () => {
  let component: EventAdd;
  let fixture: ComponentFixture<EventAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventAdd],
    }).compileComponents();

    fixture = TestBed.createComponent(EventAdd);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
