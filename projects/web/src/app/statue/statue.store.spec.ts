import { PendingTasks } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StatueDocument } from 'core';
import { StatueService } from './statue.service';
import { StatueStore } from './statue.store';
import { statueItem } from './statue.testing';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('StatueStore', () => {
  let store: InstanceType<typeof StatueStore>;
  const service = {
    getVisible: vi.fn<() => StatueDocument[] | Promise<StatueDocument[]>>(),
    getVisibleById: vi.fn<(id: string) => StatueDocument | null | Promise<StatueDocument | null>>(),
  };
  const done = vi.fn();
  const pendingTasks = { add: vi.fn(() => done) };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: StatueService, useValue: service },
        { provide: PendingTasks, useValue: pendingTasks },
      ],
    });
    store = TestBed.inject(StatueStore);
  });

  it('should start empty, idle, and without an error', () => {
    expect(store.visibleStatueItems()).toEqual([]);
    expect(store.visibleLoaded()).toBe(false);
    expect(store.selectedStatueItem()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  describe('loadVisible', () => {
    it('should apply a transfer-state hit synchronously, without a pending task', () => {
      const items = [statueItem()];
      service.getVisible.mockReturnValue(items);

      void store.loadVisible();

      expect(store.visibleStatueItems()).toBe(items);
      expect(store.visibleLoaded()).toBe(true);
      expect(store.loading()).toBe(false);
      expect(pendingTasks.add).not.toHaveBeenCalled();
    });

    it('should load from Firestore under a pending task', async () => {
      const fetch = deferred<StatueDocument[]>();
      service.getVisible.mockReturnValueOnce(fetch.promise);
      const loading = store.loadVisible();

      expect(store.loading()).toBe(true);
      expect(store.visibleLoaded()).toBe(false);
      expect(pendingTasks.add).toHaveBeenCalledOnce();

      const items = [statueItem()];
      fetch.resolve(items);
      await loading;

      expect(store.visibleStatueItems()).toEqual(items);
      expect(store.visibleLoaded()).toBe(true);
      expect(store.loading()).toBe(false);
      expect(done).toHaveBeenCalledOnce();
    });

    it('should report a failed load and release the pending task', async () => {
      service.getVisible.mockReturnValue(Promise.reject(new Error('offline')));

      await store.loadVisible();

      expect(store.loading()).toBe(false);
      expect(store.visibleLoaded()).toBe(false);
      expect(store.error()).toBe('The statues could not be loaded. Please try again later.');
      expect(done).toHaveBeenCalledOnce();
    });

    it('should ignore a slower, older load that finishes last', async () => {
      const older = deferred<StatueDocument[]>();
      const newer = deferred<StatueDocument[]>();
      service.getVisible.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);

      const first = store.loadVisible();
      const second = store.loadVisible();
      const latest = [statueItem({ id: 'latest' })];
      newer.resolve(latest);
      await second;
      older.resolve([statueItem()]);
      await first;

      expect(store.visibleStatueItems()).toEqual(latest);
    });
  });

  describe('ensureVisible', () => {
    it('should reuse a loaded list, and load again after a failure', async () => {
      service.getVisible.mockReturnValueOnce([statueItem()]);
      await store.loadVisible();
      await store.ensureVisible();
      expect(service.getVisible).toHaveBeenCalledOnce();

      service.getVisible.mockReturnValueOnce(Promise.reject(new Error('offline')));
      await store.loadVisible();
      service.getVisible.mockReturnValueOnce([statueItem()]);
      await store.ensureVisible();
      expect(service.getVisible).toHaveBeenCalledTimes(3);
    });
  });

  describe('neighbors', () => {
    const items = ['a', 'b', 'c'].map((id) => statueItem({ id, name: id.toUpperCase() }));

    async function select(id: string) {
      service.getVisible.mockReturnValue(items);
      await store.loadVisible();
      service.getVisibleById.mockReturnValue(statueItem({ id }));
      await store.loadSelected(id);
    }

    it("should be the selected statue's neighbors in list order", async () => {
      await select('b');
      expect(store.neighbors()).toEqual({ previous: items[0], next: items[2] });
    });

    it('should have nothing past either end, or for a statue not in the list', async () => {
      await select('a');
      expect(store.neighbors()).toEqual({ previous: null, next: items[1] });
      await select('c');
      expect(store.neighbors()).toEqual({ previous: items[1], next: null });
      await select('z');
      expect(store.neighbors()).toEqual({ previous: null, next: null });
    });
  });

  describe('loadSelected', () => {
    it('should select a visible statue, from Firestore or the transfer state', async () => {
      const item = statueItem();
      service.getVisibleById.mockReturnValueOnce(Promise.resolve(item));
      await expect(store.loadSelected('pioneer')).resolves.toBe(item);
      expect(service.getVisibleById).toHaveBeenCalledWith('pioneer');
      expect(store.selectedStatueItem()).toBe(item);

      service.getVisibleById.mockReturnValueOnce(item);
      await expect(store.loadSelected('pioneer')).resolves.toBe(item);
    });

    it('should resolve null for a missing or hidden statue, or a failed read', async () => {
      service.getVisibleById.mockReturnValueOnce(null);
      await expect(store.loadSelected('gone')).resolves.toBeNull();

      service.getVisibleById.mockReturnValueOnce(Promise.reject(new Error('offline')));
      await expect(store.loadSelected('gone')).resolves.toBeNull();
      expect(store.selectedStatueItem()).toBeNull();
    });

    it('should keep the newest selection when an older read settles last', async () => {
      const first = deferred<StatueDocument | null>();
      const second = statueItem({ id: 'scout' });
      service.getVisibleById
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(Promise.resolve(second));

      const a = store.loadSelected('pioneer');
      await store.loadSelected('scout');
      first.reject(new Error('offline'));

      await expect(a).resolves.toBeNull();
      expect(store.selectedStatueItem()).toBe(second);
    });

    it('should share one read between concurrent callers, then read again', async () => {
      service.getVisibleById.mockImplementation(() => Promise.resolve(statueItem()));

      const [a, b] = await Promise.all([
        store.loadSelected('pioneer'),
        store.loadSelected('pioneer'),
      ]);
      expect(a).toBe(b);
      expect(service.getVisibleById).toHaveBeenCalledOnce();

      await store.loadSelected('pioneer');
      expect(service.getVisibleById).toHaveBeenCalledTimes(2);
    });
  });
});
