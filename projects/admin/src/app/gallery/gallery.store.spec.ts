import { TestBed } from '@angular/core/testing';
import { GalleryStore } from './gallery.store';

describe('GalleryStore', () => {
  let store: InstanceType<typeof GalleryStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(GalleryStore);
  });

  it('should start empty, idle, and without an error', () => {
    expect(store.allGalleryItems()).toEqual([]);
    expect(store.selectedGalleryItem()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });
});
