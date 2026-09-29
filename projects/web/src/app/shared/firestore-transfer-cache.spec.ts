import { ApplicationRef, PLATFORM_ID, TransferState, makeStateKey } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Timestamp } from 'firebase/firestore';
import { FirestoreTransferCache, deserializeDoc, serializeDoc } from './firestore-transfer-cache';

describe('serializeDoc / deserializeDoc', () => {
  it('should round-trip nested Timestamps through JSON', () => {
    const doc = {
      id: 'a',
      created: new Timestamp(1_700_000_000, 123),
      imageUrls: ['x', 'y'],
      location: { at: new Timestamp(5, 0), city: 'Boise' },
      weight: null,
    };
    const restored = deserializeDoc(JSON.parse(JSON.stringify(serializeDoc(doc))));
    expect(restored).toEqual(doc);
    expect((restored as typeof doc).created).toBeInstanceOf(Timestamp);
  });

  it('should leave plain values alone', () => {
    expect(serializeDoc([1, 'a', null, true])).toEqual([1, 'a', null, true]);
    expect(deserializeDoc({ __timestamp: 'nope' })).toEqual({ __timestamp: 'nope' });
  });
});

describe('FirestoreTransferCache', () => {
  const key = makeStateKey<unknown>('k');
  let stable: () => void;

  function setup(platform: 'browser' | 'server') {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: platform },
        {
          provide: ApplicationRef,
          useValue: { whenStable: () => new Promise<void>((resolve) => (stable = resolve)) },
        },
      ],
    });
    return { cache: TestBed.inject(FirestoreTransferCache), state: TestBed.inject(TransferState) };
  }

  it('should store what the server fetches', async () => {
    const { cache, state } = setup('server');
    const created = new Timestamp(10, 0);
    await cache.read('k', () => Promise.resolve({ created }));
    expect(state.get(key, null)).toEqual({ created: { __timestamp: [10, 0] } });
  });

  it('should serve the browser synchronously from the server state until stable', async () => {
    const { cache, state } = setup('browser');
    state.set(key, { created: { __timestamp: [10, 0] } });
    const fetch = vi.fn(() => Promise.resolve({ created: new Timestamp(99, 0) }));

    expect(cache.read('k', fetch)).toEqual({ created: new Timestamp(10, 0) });
    expect(fetch).not.toHaveBeenCalled();

    stable();
    await Promise.resolve();
    await expect(cache.read('k', fetch)).resolves.toEqual({ created: new Timestamp(99, 0) });
    expect(fetch).toHaveBeenCalledOnce();
    // The browser never writes to the transfer state.
    expect(state.get(key, null)).toEqual({ created: { __timestamp: [10, 0] } });
  });

  it('should fetch in the browser when the server sent nothing', async () => {
    const { cache } = setup('browser');
    await expect(cache.read('k', () => Promise.resolve(1))).resolves.toBe(1);
  });
});
