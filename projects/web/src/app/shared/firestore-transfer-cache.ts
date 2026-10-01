import {
  ApplicationRef,
  InjectionToken,
  PLATFORM_ID,
  Service,
  TransferState,
  inject,
  makeStateKey,
} from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { Router } from '@angular/router';
import { Timestamp } from 'firebase/firestore/lite';

// How a Timestamp travels through TransferState, which only carries JSON.
interface EncodedTimestamp {
  __timestamp: [seconds: number, nanoseconds: number];
}

function isEncodedTimestamp(value: object): value is EncodedTimestamp {
  const encoded = (value as Partial<EncodedTimestamp>).__timestamp;
  return Array.isArray(encoded) && encoded.length === 2;
}

// Turns Firestore data into JSON-safe values, encoding every Timestamp so it can be restored.
export function serializeDoc(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return { __timestamp: [value.seconds, value.nanoseconds] } satisfies EncodedTimestamp;
  }
  if (Array.isArray(value)) {
    return value.map(serializeDoc);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, serializeDoc(v)]));
  }
  return value;
}

// Reverses serializeDoc.
export function deserializeDoc(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(deserializeDoc);
  }
  if (value && typeof value === 'object') {
    if (isEncodedTimestamp(value)) {
      return new Timestamp(...value.__timestamp);
    }
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deserializeDoc(v)]));
  }
  return value;
}

// Lives in web, not core: it imports the Firestore SDK, and anything exported from core's
// public API ends up in every app's initial bundle. Import it only from lazily loaded code.
//
// Hands Firestore reads made during server rendering to the browser, so hydration neither
// refetches every document nor waits on a Firestore round trip. The server stores each
// result in TransferState. The browser serves reads from it until the app first becomes
// stable (hydration done), then reads Firestore as usual, like HttpClient's transfer cache.
//
// A hit returns the value synchronously, so a component that reads during construction
// renders the same DOM the server sent.
//
// In the browser it also keeps a stalled read from hanging the page. iOS quietly kills the
// SDK's long-lived connection when the phone locks, a tab goes to the background, or the
// network changes, and the SDK then waits on the dead stream indefinitely. A read that takes
// longer than BROWSER_READ_TIMEOUT_MS, or fails, loads the page from the server instead, which
// always renders it. Truly offline, it fails as before so the page can say so.
@Service()
export class FirestoreTransferCache {
  private readonly state = inject(TransferState);
  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));
  private readonly router = inject(Router);
  private readonly hardNavigate = inject(HARD_NAVIGATE);
  private active = !this.isServer;

  constructor() {
    if (this.active) {
      void inject(ApplicationRef)
        .whenStable()
        .then(() => (this.active = false));
    }
  }

  read<T>(key: string, fetch: () => Promise<T>): T | Promise<T> {
    const stateKey = makeStateKey<unknown>(key);
    if (this.active && this.state.hasKey(stateKey)) {
      return deserializeDoc(this.state.get(stateKey, null)) as T;
    }
    if (this.isServer) {
      return fetch().then((value) => {
        this.state.set(stateKey, serializeDoc(value));
        return value;
      });
    }
    return this.withServerFallback(fetch());
  }

  private withServerFallback<T>(read: Promise<T>): Promise<T> {
    // Who asked: the navigation under way (a resolver's read) or the page on screen (a list
    // loaded after the page appeared). Only that one is reloaded, and only while it's current.
    const navigation = this.router.currentNavigation();
    const onScreen = location.pathname + location.search;
    const url = navigation
      ? this.router.serializeUrl(navigation.finalUrl ?? navigation.extractedUrl)
      : onScreen;
    // Still wanted while its navigation is under way, or once it has landed on that page (a
    // list starts reading during the navigation, which then completes without waiting).
    const stillWanted = () => {
      const current = this.router.currentNavigation();
      if (current) {
        return current.id === navigation?.id;
      }
      return location.pathname + location.search === url;
    };

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timedOut = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error('Firestore read timed out')),
        BROWSER_READ_TIMEOUT_MS,
      );
    });
    return Promise.race([read, timedOut])
      .finally(() => clearTimeout(timer))
      .catch((error: unknown) => {
        // Offline, abandoned (the visitor moved on), or already reloaded once for this page
        // (the server couldn't read Firestore either): fail as before, so the page's own error
        // message shows instead of a reload loop.
        if (!navigator.onLine || !stillWanted() || !claimFallback(url)) {
          throw error;
        }
        this.hardNavigate(url);
        // Never settles: the browser is leaving, so nothing should flash an error first.
        return new Promise<T>(() => undefined);
      });
  }
}

// Allows one server fallback per page per minute, remembered across the reload it causes.
const FALLBACK_KEY = 'firestore-fallback';
const FALLBACK_WINDOW_MS = 60_000;

function claimFallback(url: string): boolean {
  try {
    const last = JSON.parse(sessionStorage.getItem(FALLBACK_KEY) ?? 'null') as {
      url: string;
      at: number;
    } | null;
    if (last?.url === url && Date.now() - last.at < FALLBACK_WINDOW_MS) {
      return false;
    }
    sessionStorage.setItem(FALLBACK_KEY, JSON.stringify({ url, at: Date.now() }));
    return true;
  } catch {
    // Storage blocked (some private modes): a reload loop can't be ruled out, so don't reload.
    return false;
  }
}

// Normal reads take well under a second; past this, the connection is assumed dead.
export const BROWSER_READ_TIMEOUT_MS = 6000;

// A full page load, swappable in tests.
export const HARD_NAVIGATE = new InjectionToken<(url: string) => void>('HARD_NAVIGATE', {
  providedIn: 'root',
  factory: () => (url: string) => location.assign(url),
});
