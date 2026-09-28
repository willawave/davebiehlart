import {
  ApplicationRef,
  PLATFORM_ID,
  Service,
  TransferState,
  inject,
  makeStateKey,
} from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { Timestamp } from 'firebase/firestore';

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
@Service()
export class FirestoreTransferCache {
  private readonly state = inject(TransferState);
  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));
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
    return fetch().then((value) => {
      if (this.isServer) {
        this.state.set(stateKey, serializeDoc(value));
      }
      return value;
    });
  }
}
