import { TestBed } from '@angular/core/testing';
import { EventDocument } from 'core';
import { Timestamp } from 'firebase/firestore';
import { EventFormValue, EventService } from './event.service';
import { EventStore } from './event.store';

const item = (id: string, name = id): EventDocument => ({
  id,
  date: Timestamp.fromDate(new Date('2026-10-10T05:00:00Z')),
  description: 'd',
  link: null,
  location: {
    city: 'Elkhorn',
    latitude: 41.28,
    longitude: -96.23,
    state: 'Nebraska',
    street: '2610 North Main Street',
    venue: 'Main Street Studios',
  },
  name,
  time: '18:30',
  visible: true,
});

describe('EventStore', () => {
  let store: InstanceType<typeof EventStore>;
  const service = {
    getAll: vi.fn(() => Promise.resolve([item('a'), item('b')])),
    getById: vi.fn((id: string) => Promise.resolve(id === 'a' ? item('a') : null)),
    add: vi.fn(() => Promise.resolve('new-id')),
    update: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
  };
  const value = {} as EventFormValue;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: EventService, useValue: service }] });
    store = TestBed.inject(EventStore);
  });

  it('should start empty, idle, and without an error', () => {
    expect(store.allEvents()).toEqual([]);
    expect(store.selectedEvent()).toBeNull();
    expect(store.selectedFormValue()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should load every item', async () => {
    const loading = store.loadAll();
    expect(store.loading()).toBe(true);
    await expect(loading).resolves.toBe(true);
    expect(store.allEvents().map((i) => i.id)).toEqual(['a', 'b']);
    expect(store.loading()).toBe(false);
  });

  it('should report a failed load', async () => {
    service.getAll.mockRejectedValueOnce(new Error('offline'));
    await expect(store.loadAll()).resolves.toBe(false);
    expect(store.error()).toMatch(/could not be loaded/);
    expect(store.loading()).toBe(false);
  });

  it('should load one item and expose it as a form value', async () => {
    await store.loadOne('a');
    expect(store.selectedEvent()?.id).toBe('a');
    expect(store.selectedFormValue()?.name).toBe('a');
    expect(store.selectedFormValue()?.link).toBe('');

    await store.loadOne('missing');
    expect(store.selectedEvent()).toBeNull();
  });

  it('should keep the newest item when an older load finishes last', async () => {
    let finishOld!: (item: EventDocument | null) => void;
    service.getById
      .mockReturnValueOnce(new Promise((resolve) => (finishOld = resolve)))
      .mockReturnValueOnce(Promise.resolve(item('b')));

    const old = store.loadOne('a');
    await store.loadOne('b');
    finishOld(item('a'));
    await old;

    expect(store.selectedEvent()?.id).toBe('b');
    expect(store.loading()).toBe(false);
  });

  it("should not report an older load's failure over the newest item", async () => {
    let failOld!: (error: Error) => void;
    service.getById
      .mockReturnValueOnce(new Promise((_, reject) => (failOld = reject)))
      .mockReturnValueOnce(Promise.resolve(item('b')));

    const old = store.loadOne('a');
    await store.loadOne('b');
    failOld(new Error('offline'));

    await expect(old).resolves.toBe(false);
    expect(store.selectedEvent()?.id).toBe('b');
    expect(store.error()).toBeNull();
  });

  it('should report a failed item load', async () => {
    service.getById.mockRejectedValueOnce(new Error('offline'));
    await expect(store.loadOne('a')).resolves.toBe(false);
    expect(store.error()).toMatch(/could not be loaded/);
    expect(store.loading()).toBe(false);
  });

  it('should add and update through the service', async () => {
    await expect(store.add(value)).resolves.toBe(true);
    expect(service.add).toHaveBeenCalledWith(value);
    await expect(store.update('a', value)).resolves.toBe(true);
    expect(service.update).toHaveBeenCalledWith('a', value);

    service.update.mockRejectedValueOnce(new Error('denied'));
    await expect(store.update('a', value)).resolves.toBe(false);
    expect(store.error()).toMatch(/could not be saved/);

    store.clearError();
    expect(store.error()).toBeNull();
  });

  it('should remove a deleted item from the list', async () => {
    await store.loadAll();
    await expect(store.remove(item('a'))).resolves.toBe(true);
    expect(store.allEvents().map((i) => i.id)).toEqual(['b']);

    service.delete.mockRejectedValueOnce(new Error('denied'));
    await expect(store.remove(item('b', 'Open Studio'))).resolves.toBe(false);
    expect(store.error()).toBe('"Open Studio" could not be deleted. Please try again.');
    expect(store.allEvents().map((i) => i.id)).toEqual(['b']);
  });
});
