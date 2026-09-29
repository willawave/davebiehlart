import { TestBed } from '@angular/core/testing';
import { StatueDocument } from 'core';
import { Timestamp } from 'firebase/firestore';
import { StatueFormValue, StatueService } from './statue.service';
import { StatueStore } from './statue.store';

const item = (id: string, name = id): StatueDocument => ({
  id,
  dedicated: Timestamp.fromDate(new Date('2024-01-01T00:00:00Z')),
  description: 'd',
  imageUrls: ['a.jpg'],
  location: {
    city: 'Omaha',
    latitude: 41.25,
    longitude: -95.99,
    state: 'Nebraska',
    street: '1 Main St',
    venue: 'Gene Leahy Mall',
  },
  name,
  storageKey: `key-${id}`,
  visible: true,
});

describe('StatueStore', () => {
  let store: InstanceType<typeof StatueStore>;
  const service = {
    getAll: vi.fn(() => Promise.resolve([item('a'), item('b')])),
    getById: vi.fn((id: string) => Promise.resolve(id === 'a' ? item('a') : null)),
    newStorageKey: vi.fn(() => 'new-key'),
    add: vi.fn(() => Promise.resolve('new-id')),
    update: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
    uploadImages: vi.fn(() => Promise.resolve(['u1.jpg'])),
    discardImages: vi.fn(() => Promise.resolve()),
  };
  const value = {} as StatueFormValue;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: StatueService, useValue: service }] });
    store = TestBed.inject(StatueStore);
  });

  it('should start empty, idle, and without an error', () => {
    expect(store.allStatueItems()).toEqual([]);
    expect(store.selectedStatueItem()).toBeNull();
    expect(store.selectedFormValue()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should load every item', async () => {
    const loading = store.loadAll();
    expect(store.loading()).toBe(true);
    await expect(loading).resolves.toBe(true);
    expect(store.allStatueItems().map((i) => i.id)).toEqual(['a', 'b']);
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
    expect(store.selectedStatueItem()?.id).toBe('a');
    expect(store.selectedFormValue()?.name).toBe('a');

    await store.loadOne('missing');
    expect(store.selectedStatueItem()).toBeNull();
  });

  it('should keep the newest item when an older load finishes last', async () => {
    let finishOld!: (item: StatueDocument | null) => void;
    service.getById
      .mockReturnValueOnce(new Promise((resolve) => (finishOld = resolve)))
      .mockReturnValueOnce(Promise.resolve(item('b')));

    const old = store.loadOne('a');
    await store.loadOne('b');
    finishOld(item('a'));
    await old;

    expect(store.selectedStatueItem()?.id).toBe('b');
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
    expect(store.selectedStatueItem()?.id).toBe('b');
    expect(store.error()).toBeNull();
  });

  it('should report a failed item load', async () => {
    service.getById.mockRejectedValueOnce(new Error('offline'));
    await expect(store.loadOne('a')).resolves.toBe(false);
    expect(store.error()).toMatch(/could not be loaded/);
    expect(store.loading()).toBe(false);
  });

  it('should add and update through the service', async () => {
    await expect(store.add(value, 'k')).resolves.toBe(true);
    expect(service.add).toHaveBeenCalledWith(value, 'k');
    await expect(store.update('a', value, 'k')).resolves.toBe(true);
    expect(service.update).toHaveBeenCalledWith('a', value, 'k');

    service.update.mockRejectedValueOnce(new Error('denied'));
    await expect(store.update('a', value, 'k')).resolves.toBe(false);
    expect(store.error()).toMatch(/could not be saved/);
  });

  it('should remove a deleted item from the list', async () => {
    await store.loadAll();
    await expect(store.remove(item('a'))).resolves.toBe(true);
    expect(store.allStatueItems().map((i) => i.id)).toEqual(['b']);

    service.delete.mockRejectedValueOnce(new Error('denied'));
    await expect(store.remove(item('b', 'Heron'))).resolves.toBe(false);
    expect(store.error()).toBe('"Heron" could not be deleted. Please try again.');
    expect(store.allStatueItems().map((i) => i.id)).toEqual(['b']);
  });

  it('should upload photos without blocking the form, and report failures', async () => {
    const files = [new File(['x'], 'a.jpg')];
    await expect(store.uploadImages(files, 'k')).resolves.toEqual(['u1.jpg']);
    expect(store.loading()).toBe(false);

    service.uploadImages.mockRejectedValueOnce(new Error('too big'));
    await expect(store.uploadImages(files, 'k')).resolves.toBeNull();
    expect(store.error()).toMatch(/could not be uploaded/);
  });

  it('should discard photos best effort, skipping empty lists', async () => {
    await store.discardImages([], 'k');
    expect(service.discardImages).not.toHaveBeenCalled();

    service.discardImages.mockRejectedValueOnce(new Error('offline'));
    await expect(store.discardImages(['a.jpg'], 'k')).resolves.toBeUndefined();
    expect(service.discardImages).toHaveBeenCalledWith(['a.jpg'], 'k');
  });

  it('should hand out new storage keys', () => {
    expect(store.newStorageKey()).toBe('new-key');
  });
});
