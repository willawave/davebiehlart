import { TestBed } from '@angular/core/testing';
import { StatueStore } from './statue.store';

describe('StatueStore', () => {
  let store: InstanceType<typeof StatueStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(StatueStore);
  });

  it('should start empty, idle, and without an error', () => {
    expect(store.allStatueItems()).toEqual([]);
    expect(store.selectedStatueItem()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });
});
