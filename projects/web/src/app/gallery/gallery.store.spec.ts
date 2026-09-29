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

  describe('ensureVisible', () => {
    it('should reuse a list already loaded for the same style', async () => {
      service.getVisible.mockReturnValue([galleryItem()]);
      await store.loadVisible(GalleryStyle.BRONZE);

      await store.ensureVisible(GalleryStyle.BRONZE);

      expect(service.getVisible).toHaveBeenCalledOnce();
    });

    it('should load the list for another style, or after a failed load', async () => {
      service.getVisible.mockReturnValueOnce([galleryItem()]);
      await store.loadVisible(GalleryStyle.BRONZE);
      service.getVisible.mockReturnValueOnce(Promise.resolve([]));
      await store.ensureVisible(GalleryStyle.GLASS);
      expect(service.getVisible).toHaveBeenLastCalledWith(GalleryStyle.GLASS);

      service.getVisible.mockReturnValueOnce(Promise.reject(new Error('offline')));
      await store.loadVisible(GalleryStyle.BRONZE);
      service.getVisible.mockReturnValueOnce([galleryItem()]);
      await store.ensureVisible(GalleryStyle.BRONZE);
      expect(service.getVisible).toHaveBeenCalledTimes(4);
    });
  });

  describe('neighbors', () => {
    const items = ['a', 'b', 'c'].map((id) => galleryItem({ id, name: id.toUpperCase() }));

    async function select(id: string) {
      service.getVisible.mockReturnValue(items);
      await store.loadVisible(GalleryStyle.BRONZE);
      service.getVisibleById.mockReturnValue(galleryItem({ id }));
      await store.loadSelected(id, GalleryStyle.BRONZE);
    }

    it("should be the selected item's newer and older neighbors in list order", async () => {
      await select('b');
      expect(store.neighbors().previous?.id).toBe('a');
      expect(store.neighbors().next?.id).toBe('c');
    });

    it('should have nothing past either end', async () => {
      await select('a');
      expect(store.neighbors()).toEqual({ previous: null, next: items[1] });
      await select('c');
      expect(store.neighbors()).toEqual({ previous: items[1], next: null });
    });

    it('should have nothing when the item is not in the list', async () => {
      await select('z');
      expect(store.neighbors()).toEqual({ previous: null, next: null });
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

    it('should keep the newest selection when an older read finishes last', async () => {
      const first = deferred<GalleryDocument | null>();
      const second = galleryItem({ id: 'heron', name: 'Heron' });
      service.getVisibleById
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(Promise.resolve(second));

      const a = store.loadSelected('mustang', GalleryStyle.BRONZE);
      await store.loadSelected('heron', GalleryStyle.BRONZE);
      first.resolve(galleryItem());

      // The superseded navigation still gets its own answer.
      await expect(a).resolves.toEqual(galleryItem());
      expect(store.selectedGalleryItem()).toBe(second);
    });

    it('should not blank the newest selection when an older read fails last', async () => {
      const first = deferred<GalleryDocument | null>();
      const second = galleryItem({ id: 'heron' });
      service.getVisibleById
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(Promise.resolve(second));

      const a = store.loadSelected('mustang', GalleryStyle.BRONZE);
      await store.loadSelected('heron', GalleryStyle.BRONZE);
      first.reject(new Error('offline'));

      await expect(a).resolves.toBeNull();
      expect(store.selectedGalleryItem()).toBe(second);
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
