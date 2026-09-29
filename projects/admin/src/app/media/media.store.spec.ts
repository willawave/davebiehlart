import { TestBed } from '@angular/core/testing';
import { MediaDocument } from 'core';
import { Timestamp } from 'firebase/firestore';
import { MediaFormValue, MediaService } from './media.service';
import { MediaStore } from './media.store';

const item = (id: string, title = id): MediaDocument => ({
  id,
  date: Timestamp.fromDate(new Date('2026-09-12T05:00:00Z')),
  description: 'd',
  link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  title,
  visible: true,
});

describe('MediaStore', () => {
  let store: InstanceType<typeof MediaStore>;
  const service = {
    getAll: vi.fn(() => Promise.resolve([item('a'), item('b')])),
    getById: vi.fn((id: string) => Promise.resolve(id === 'a' ? item('a') : null)),
    add: vi.fn(() => Promise.resolve('new-id')),
    update: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
  };
  const value = {} as MediaFormValue;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: MediaService, useValue: service }] });
    store = TestBed.inject(MediaStore);
  });

  it('should start empty, idle, and without an error', () => {
    expect(store.allMediaItems()).toEqual([]);
    expect(store.selectedMediaItem()).toBeNull();
    expect(store.selectedFormValue()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should load every item', async () => {
    const loading = store.loadAll();
    expect(store.loading()).toBe(true);
    await expect(loading).resolves.toBe(true);
    expect(store.allMediaItems().map((i) => i.id)).toEqual(['a', 'b']);
    expect(store.loading()).toBe(false);
  });

  it('should report a failed load', async () => {
    service.getAll.mockRejectedValueOnce(new Error('offline'));
    await expect(store.loadAll()).resolves.toBe(false);
    expect(store.error()).toMatch(/could not be loaded/);
  });

  it('should load one item and expose it as a form value', async () => {
    await store.loadOne('a');
    expect(store.selectedMediaItem()?.id).toBe('a');
    expect(store.selectedFormValue()?.title).toBe('a');

    await store.loadOne('missing');
    expect(store.selectedMediaItem()).toBeNull();
  });

  it('should keep the newest item when an older load finishes last', async () => {
    let finishOld!: (item: MediaDocument | null) => void;
    service.getById
      .mockReturnValueOnce(new Promise((resolve) => (finishOld = resolve)))
      .mockReturnValueOnce(Promise.resolve(item('b')));

    const old = store.loadOne('a');
    await store.loadOne('b');
    finishOld(item('a'));
    await old;

    expect(store.selectedMediaItem()?.id).toBe('b');
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
    expect(store.allMediaItems().map((i) => i.id)).toEqual(['b']);

    service.delete.mockRejectedValueOnce(new Error('denied'));
    await expect(store.remove(item('b', 'In the Studio'))).resolves.toBe(false);
    expect(store.error()).toBe('"In the Studio" could not be deleted. Please try again.');
  });
});
