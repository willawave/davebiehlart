import { TestBed } from '@angular/core/testing';
import { EventStore } from './event.store';

describe('EventStore', () => {
  let store: InstanceType<typeof EventStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(EventStore);
  });

  it('should start empty, idle, and without an error', () => {
    expect(store.allEvents()).toEqual([]);
    expect(store.selectedEvent()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });
});
