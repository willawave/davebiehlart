import { ApplicationRef, PLATFORM_ID, TransferState, makeStateKey } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { Timestamp } from 'firebase/firestore';
import {
  BROWSER_READ_TIMEOUT_MS,
  FirestoreTransferCache,
  HARD_NAVIGATE,
  deserializeDoc,
  serializeDoc,
} from './firestore-transfer-cache';

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

  // A Firestore stream iOS killed never answers; the page must come from the server instead.
  describe('when a browser read stalls or fails', () => {
    const hardNavigate = vi.fn<(url: string) => void>();
    let navigation: { finalUrl?: UrlTree; extractedUrl: UrlTree } | null;
    const never = () => new Promise<number>(() => undefined);

    function setupBrowser() {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          {
            provide: ApplicationRef,
            useValue: { whenStable: () => new Promise<void>(() => undefined) },
          },
          { provide: HARD_NAVIGATE, useValue: hardNavigate },
        ],
      });
      const router = TestBed.inject(Router);
      vi.spyOn(router, 'currentNavigation').mockImplementation(
        () => navigation as ReturnType<Router['currentNavigation']>,
      );
      return { cache: TestBed.inject(FirestoreTransferCache), router };
    }

    beforeEach(() => {
      vi.useFakeTimers();
      hardNavigate.mockClear();
      navigation = null;
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it('should load the page being opened from the server when a read times out', async () => {
      const { cache, router } = setupBrowser();
      navigation = { extractedUrl: router.parseUrl('/statues/pioneer?x=1') };
      const settled = vi.fn();
      void (cache.read('k', never) as Promise<number>).then(settled, settled);

      await vi.advanceTimersByTimeAsync(BROWSER_READ_TIMEOUT_MS - 1);
      expect(hardNavigate).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(hardNavigate).toHaveBeenCalledWith('/statues/pioneer?x=1');
      // Nothing settles, so the page shows no error while the browser leaves.
      expect(settled).not.toHaveBeenCalled();
    });

    it('should prefer the URL the navigation was redirected to', async () => {
      const { cache, router } = setupBrowser();
      navigation = { extractedUrl: router.parseUrl('/a'), finalUrl: router.parseUrl('/b') };
      void cache.read('k', never);
      await vi.advanceTimersByTimeAsync(BROWSER_READ_TIMEOUT_MS);
      expect(hardNavigate).toHaveBeenCalledWith('/b');
    });

    it('should reload the page on screen when no navigation is under way', async () => {
      const { cache } = setupBrowser();
      void cache.read('k', never);
      await vi.advanceTimersByTimeAsync(BROWSER_READ_TIMEOUT_MS);
      expect(hardNavigate).toHaveBeenCalledWith(location.pathname + location.search);
    });

    it('should fall back to the server when a read fails, rather than surface the error', async () => {
      const { cache, router } = setupBrowser();
      navigation = { extractedUrl: router.parseUrl('/bronzes/a') };
      const settled = vi.fn();
      void (
        cache.read('k', () => Promise.reject(new Error('unavailable'))) as Promise<number>
      ).then(settled, settled);
      await vi.advanceTimersByTimeAsync(0);
      expect(hardNavigate).toHaveBeenCalledWith('/bronzes/a');
      expect(settled).not.toHaveBeenCalled();
    });

    it('should fail as before when the device is offline', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
      const { cache } = setupBrowser();
      const read = cache.read('k', never) as Promise<number>;
      const rejected = expect(read).rejects.toThrow('timed out');
      await vi.advanceTimersByTimeAsync(BROWSER_READ_TIMEOUT_MS);
      await rejected;
      expect(hardNavigate).not.toHaveBeenCalled();
    });

    it('should resolve a read that answers in time, and leave no timer behind', async () => {
      const { cache } = setupBrowser();
      await expect(cache.read('k', () => Promise.resolve(7))).resolves.toBe(7);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('should never time out on the server', async () => {
      TestBed.resetTestingModule();
      const { cache } = setup('server');
      void cache.read('k', never);
      expect(vi.getTimerCount()).toBe(0);
    });
  });
});
