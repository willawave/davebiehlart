import { TestBed } from '@angular/core/testing';
import { MediaStore } from './media.store';

describe('MediaStore', () => {
  let store: InstanceType<typeof MediaStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(MediaStore);
  });

  it('should start empty, idle, and without an error', () => {
    expect(store.visibleMediaItems()).toEqual([]);
    expect(store.selectedMediaItem()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });
});
