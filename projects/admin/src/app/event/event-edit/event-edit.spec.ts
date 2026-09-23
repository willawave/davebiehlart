import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventEdit } from './event-edit';

describe('EventEdit', () => {
  let component: EventEdit;
  let fixture: ComponentFixture<EventEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventEdit],
    }).compileComponents();

    fixture = TestBed.createComponent(EventEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
