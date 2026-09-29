import { PendingTasks } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MediaDocument } from 'core';
import { MediaService } from './media.service';
import { MediaStore } from './media.store';
import { articleItem, videoItem } from './media.testing';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('MediaStore', () => {
  let store: InstanceType<typeof MediaStore>;
  const service = {
    getVisible: vi.fn<() => MediaDocument[] | Promise<MediaDocument[]>>(),
    getVisibleById: vi.fn<(id: string) => MediaDocument | null | Promise<MediaDocument | null>>(),
  };
  const done = vi.fn();
  const pendingTasks = { add: vi.fn(() => done) };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: MediaService, useValue: service },
        { provide: PendingTasks, useValue: pendingTasks },
      ],
    });
    store = TestBed.inject(MediaStore);
  });

  it('should start empty, idle, and without an error', () => {
    expect(store.visibleMediaItems()).toEqual([]);
    expect(store.selectedMediaItem()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  describe('loadVisible', () => {
    it('should apply a transfer-state hit synchronously, without a pending task', () => {
      const items = [videoItem(), articleItem()];
      service.getVisible.mockReturnValue(items);

      void store.loadVisible();

      expect(store.visibleMediaItems()).toBe(items);
      expect(store.loading()).toBe(false);
      expect(pendingTasks.add).not.toHaveBeenCalled();
    });

    it('should load from Firestore under a pending task', async () => {
      const fetch = deferred<MediaDocument[]>();
      service.getVisible.mockReturnValueOnce(fetch.promise);
      const loading = store.loadVisible();

      expect(store.loading()).toBe(true);
      expect(pendingTasks.add).toHaveBeenCalledOnce();

      const items = [videoItem()];
      fetch.resolve(items);
      await loading;

      expect(store.visibleMediaItems()).toEqual(items);
      expect(store.loading()).toBe(false);
      expect(done).toHaveBeenCalledOnce();
    });

    it('should report a failed load and release the pending task', async () => {
      service.getVisible.mockReturnValue(Promise.reject(new Error('offline')));
      await store.loadVisible();
      expect(store.loading()).toBe(false);
      expect(store.error()).toBe('The media could not be loaded. Please try again later.');
      expect(done).toHaveBeenCalledOnce();
    });

    it('should ignore a slower, older load that finishes last', async () => {
      const older = deferred<MediaDocument[]>();
      const newer = deferred<MediaDocument[]>();
      service.getVisible.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);

      const first = store.loadVisible();
      const second = store.loadVisible();
      const latest = [videoItem({ id: 'latest' })];
      newer.resolve(latest);
      await second;
      older.resolve([articleItem()]);
      await first;

      expect(store.visibleMediaItems()).toEqual(latest);
    });
  });

  describe('loadSelected', () => {
    it('should select a visible item, from Firestore or the transfer state', async () => {
      const item = videoItem();
      service.getVisibleById.mockReturnValueOnce(Promise.resolve(item));
      await expect(store.loadSelected('on-air')).resolves.toBe(item);
      expect(store.selectedMediaItem()).toBe(item);

      service.getVisibleById.mockReturnValueOnce(item);
      await expect(store.loadSelected('on-air')).resolves.toBe(item);
    });

    it('should resolve null for a missing or hidden item, or a failed read', async () => {
      service.getVisibleById.mockReturnValueOnce(null);
      await expect(store.loadSelected('gone')).resolves.toBeNull();

      service.getVisibleById.mockReturnValueOnce(Promise.reject(new Error('offline')));
      await expect(store.loadSelected('gone')).resolves.toBeNull();
      expect(store.selectedMediaItem()).toBeNull();
    });

    it('should share one read between concurrent callers, then read again', async () => {
      service.getVisibleById.mockImplementation(() => Promise.resolve(videoItem()));

      const [a, b] = await Promise.all([
        store.loadSelected('on-air'),
        store.loadSelected('on-air'),
      ]);
      expect(a).toBe(b);
      expect(service.getVisibleById).toHaveBeenCalledOnce();

      await store.loadSelected('on-air');
      expect(service.getVisibleById).toHaveBeenCalledTimes(2);
    });
  });
});
