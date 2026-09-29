import { PendingTasks } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EventDocument } from 'core';
import { EventService } from './event.service';
import { EventStore } from './event.store';
import { eventItem } from './event.testing';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('EventStore', () => {
  let store: InstanceType<typeof EventStore>;
  const service = {
    getUpcoming: vi.fn<() => EventDocument[] | Promise<EventDocument[]>>(),
    getVisibleById: vi.fn<(id: string) => EventDocument | null | Promise<EventDocument | null>>(),
  };
  const done = vi.fn();
  const pendingTasks = { add: vi.fn(() => done) };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: EventService, useValue: service },
        { provide: PendingTasks, useValue: pendingTasks },
      ],
    });
    store = TestBed.inject(EventStore);
  });

  it('should start empty, idle, and without an error', () => {
    expect(store.upcomingEvents()).toEqual([]);
    expect(store.selectedEvent()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  describe('loadUpcoming', () => {
    it('should apply a transfer-state hit synchronously, without a pending task', () => {
      const items = [eventItem()];
      service.getUpcoming.mockReturnValue(items);

      void store.loadUpcoming();

      expect(store.upcomingEvents()).toBe(items);
      expect(store.loading()).toBe(false);
      expect(pendingTasks.add).not.toHaveBeenCalled();
    });

    it('should load from Firestore under a pending task', async () => {
      const fetch = deferred<EventDocument[]>();
      service.getUpcoming.mockReturnValueOnce(fetch.promise);
      const loading = store.loadUpcoming();

      expect(store.loading()).toBe(true);
      expect(pendingTasks.add).toHaveBeenCalledOnce();

      const items = [eventItem()];
      fetch.resolve(items);
      await loading;

      expect(store.upcomingEvents()).toEqual(items);
      expect(store.loading()).toBe(false);
      expect(done).toHaveBeenCalledOnce();
    });

    it('should report a failed load and release the pending task', async () => {
      service.getUpcoming.mockReturnValue(Promise.reject(new Error('offline')));

      await store.loadUpcoming();

      expect(store.loading()).toBe(false);
      expect(store.error()).toBe('The events could not be loaded. Please try again later.');
      expect(done).toHaveBeenCalledOnce();
    });

    it('should ignore a slower, older load that finishes last', async () => {
      const older = deferred<EventDocument[]>();
      const newer = deferred<EventDocument[]>();
      service.getUpcoming.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);

      const first = store.loadUpcoming();
      const second = store.loadUpcoming();
      const latest = [eventItem({ id: 'latest' })];
      newer.resolve(latest);
      await second;
      older.resolve([eventItem()]);
      await first;

      expect(store.upcomingEvents()).toEqual(latest);
    });
  });

  describe('loadSelected', () => {
    it('should select a visible event, from Firestore or the transfer state', async () => {
      const item = eventItem();
      service.getVisibleById.mockReturnValueOnce(Promise.resolve(item));
      await expect(store.loadSelected('open-studio')).resolves.toBe(item);
      expect(service.getVisibleById).toHaveBeenCalledWith('open-studio');
      expect(store.selectedEvent()).toBe(item);

      service.getVisibleById.mockReturnValueOnce(item);
      await expect(store.loadSelected('open-studio')).resolves.toBe(item);
    });

    it('should resolve null for a missing or hidden event, or a failed read', async () => {
      service.getVisibleById.mockReturnValueOnce(null);
      await expect(store.loadSelected('gone')).resolves.toBeNull();

      service.getVisibleById.mockReturnValueOnce(Promise.reject(new Error('offline')));
      await expect(store.loadSelected('gone')).resolves.toBeNull();
      expect(store.selectedEvent()).toBeNull();
    });

    it('should keep the newest selection when an older read settles last', async () => {
      const first = deferred<EventDocument | null>();
      const second = eventItem({ id: 'workshop' });
      service.getVisibleById
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(Promise.resolve(second));

      const a = store.loadSelected('open-studio');
      await store.loadSelected('workshop');
      first.reject(new Error('offline'));

      await expect(a).resolves.toBeNull();
      expect(store.selectedEvent()).toBe(second);
    });

    it('should share one read between concurrent callers, then read again', async () => {
      service.getVisibleById.mockImplementation(() => Promise.resolve(eventItem()));

      const [a, b] = await Promise.all([
        store.loadSelected('open-studio'),
        store.loadSelected('open-studio'),
      ]);
      expect(a).toBe(b);
      expect(service.getVisibleById).toHaveBeenCalledOnce();

      await store.loadSelected('open-studio');
      expect(service.getVisibleById).toHaveBeenCalledTimes(2);
    });
  });
});
