import { PendingTasks } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GalleryDocument, GalleryStyle } from 'core';
import { GalleryService } from './gallery.service';
import { GalleryStore } from './gallery.store';
import { galleryItem } from './gallery.testing';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('GalleryStore', () => {
  let store: InstanceType<typeof GalleryStore>;
  const service = {
    getVisible: vi.fn<(style: GalleryStyle) => GalleryDocument[] | Promise<GalleryDocument[]>>(),
    getVisibleById:
      vi.fn<(id: string) => GalleryDocument | null | Promise<GalleryDocument | null>>(),
  };
  const done = vi.fn();
  const pendingTasks = { add: vi.fn(() => done) };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: GalleryService, useValue: service },
        { provide: PendingTasks, useValue: pendingTasks },
      ],
    });
    store = TestBed.inject(GalleryStore);
  });

  it('should start empty, idle, and without an error', () => {
    expect(store.visibleGalleryItems()).toEqual([]);
    expect(store.selectedGalleryItem()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  describe('loadVisible', () => {
    it('should apply a transfer-state hit synchronously, without a pending task', () => {
      const items = [galleryItem()];
      service.getVisible.mockReturnValue(items);

      void store.loadVisible(GalleryStyle.BRONZE);

      expect(service.getVisible).toHaveBeenCalledWith(GalleryStyle.BRONZE);
      expect(store.visibleGalleryItems()).toBe(items);
      expect(store.loading()).toBe(false);
      expect(pendingTasks.add).not.toHaveBeenCalled();
    });

    it('should load from Firestore under a pending task, clearing the previous list', async () => {
      service.getVisible.mockReturnValueOnce([galleryItem({ id: 'old' })]);
      void store.loadVisible(GalleryStyle.BRONZE);

      const fetch = deferred<GalleryDocument[]>();
      service.getVisible.mockReturnValueOnce(fetch.promise);
      const loading = store.loadVisible(GalleryStyle.GLASS);

      expect(store.visibleGalleryItems()).toEqual([]);
      expect(store.loading()).toBe(true);
      expect(pendingTasks.add).toHaveBeenCalledOnce();

      const glass = [galleryItem({ id: 'bowl', style: GalleryStyle.GLASS })];
      fetch.resolve(glass);
      await loading;

      expect(store.visibleGalleryItems()).toEqual(glass);
      expect(store.loading()).toBe(false);
      expect(done).toHaveBeenCalledOnce();
    });

    it('should report a failed load and release the pending task', async () => {
      service.getVisible.mockReturnValue(Promise.reject(new Error('offline')));

      await store.loadVisible(GalleryStyle.BRONZE);

      expect(store.loading()).toBe(false);
      expect(store.error()).toMatch(/could not be loaded/);
      expect(done).toHaveBeenCalledOnce();
    });

    it('should ignore a slower, older load that finishes last', async () => {
      const bronzes = deferred<GalleryDocument[]>();
      const glass = deferred<GalleryDocument[]>();
      service.getVisible.mockReturnValueOnce(bronzes.promise).mockReturnValueOnce(glass.promise);

      const first = store.loadVisible(GalleryStyle.BRONZE);
      const second = store.loadVisible(GalleryStyle.GLASS);
      const glassItems = [galleryItem({ id: 'bowl', style: GalleryStyle.GLASS })];
      glass.resolve(glassItems);
      await second;
      bronzes.resolve([galleryItem()]);
      await first;

      expect(store.visibleGalleryItems()).toEqual(glassItems);
      expect(done).toHaveBeenCalledTimes(2);
    });
  });

  describe('loadSelected', () => {
    it('should select a visible item of the requested style', async () => {
      const item = galleryItem();
      service.getVisibleById.mockReturnValue(Promise.resolve(item));

      await expect(store.loadSelected('mustang', GalleryStyle.BRONZE)).resolves.toBe(item);
      expect(service.getVisibleById).toHaveBeenCalledWith('mustang');
      expect(store.selectedGalleryItem()).toBe(item);
    });

    it('should accept a synchronous transfer-state hit', async () => {
      const item = galleryItem();
      service.getVisibleById.mockReturnValue(item);
      await expect(store.loadSelected('mustang', GalleryStyle.BRONZE)).resolves.toBe(item);
    });

    it('should reject an item of the other style', async () => {
      service.getVisibleById.mockReturnValue(galleryItem({ style: GalleryStyle.GLASS }));

      await expect(store.loadSelected('mustang', GalleryStyle.BRONZE)).resolves.toBeNull();
      expect(store.selectedGalleryItem()).toBeNull();
    });

    it('should resolve null for a missing or hidden item, or a failed read', async () => {
      service.getVisibleById.mockReturnValueOnce(null);
      await expect(store.loadSelected('gone', GalleryStyle.BRONZE)).resolves.toBeNull();

      service.getVisibleById.mockReturnValueOnce(Promise.reject(new Error('offline')));
      await expect(store.loadSelected('gone', GalleryStyle.BRONZE)).resolves.toBeNull();
      expect(store.selectedGalleryItem()).toBeNull();
    });

    it('should share one read between concurrent callers, then read again', async () => {
      service.getVisibleById.mockImplementation(() => Promise.resolve(galleryItem()));

      const [a, b] = await Promise.all([
        store.loadSelected('mustang', GalleryStyle.BRONZE),
        store.loadSelected('mustang', GalleryStyle.BRONZE),
      ]);
      expect(a).toBe(b);
      expect(service.getVisibleById).toHaveBeenCalledOnce();

      await store.loadSelected('mustang', GalleryStyle.BRONZE);
      expect(service.getVisibleById).toHaveBeenCalledTimes(2);
    });
  });
});
