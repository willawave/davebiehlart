import { MediaMatcher } from '@angular/cdk/layout';
import { DOCUMENT, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { COLOR_SCHEME_STORAGE_KEY, ColorSchemeService } from './color-scheme.service';

// A media query whose system preference the test can change.
class FakeQuery {
  readonly listeners = new Set<(event: MediaQueryListEvent) => void>();

  constructor(public matches: boolean) {}

  addListener(listener: (event: MediaQueryListEvent) => void): void {
    this.listeners.add(listener);
  }

  removeListener(listener: (event: MediaQueryListEvent) => void): void {
    this.listeners.delete(listener);
  }

  systemPrefers(light: boolean): void {
    this.matches = light;
    this.listeners.forEach((listener) => listener({ matches: light } as MediaQueryListEvent));
  }
}

let query: FakeQuery;

function createWithPreference(prefersLight: boolean): ColorSchemeService {
  query = new FakeQuery(prefersLight);
  const matchMedia = vi.fn(() => query as unknown as MediaQueryList);
  TestBed.configureTestingModule({
    providers: [{ provide: MediaMatcher, useValue: { matchMedia } }],
  });
  const service = TestBed.inject(ColorSchemeService);
  expect(matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: light)');
  return service;
}

describe('ColorSchemeService', () => {
  let root: HTMLElement;

  beforeEach(() => {
    localStorage.clear();
    root = TestBed.inject(DOCUMENT).documentElement;
    root.style.colorScheme = '';
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    localStorage.clear();
    root.style.colorScheme = '';
  });

  it('should be created', () => {
    TestBed.configureTestingModule({});
    expect(TestBed.inject(ColorSchemeService)).toBeTruthy();
  });

  it('should start in light mode when the system prefers light', () => {
    expect(createWithPreference(true).isLightMode()).toBe(true);
  });

  it('should start in dark mode when the system does not prefer light', () => {
    expect(createWithPreference(false).isLightMode()).toBe(false);
  });

  it('should leave the page scheme to CSS until the visitor toggles', () => {
    createWithPreference(true);
    expect(root.style.colorScheme).toBe('');
  });

  it('should toggle the page scheme and remember the choice', () => {
    const service = createWithPreference(true);

    service.toggle();
    expect(service.isLightMode()).toBe(false);
    expect(root.style.colorScheme).toBe('dark');
    expect(localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBe('dark');

    service.toggle();
    expect(service.isLightMode()).toBe(true);
    expect(root.style.colorScheme).toBe('light');
    expect(localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBe('light');
  });

  it('should follow system changes until the visitor toggles', () => {
    const service = createWithPreference(true);

    query.systemPrefers(false);
    expect(service.isLightMode()).toBe(false);
    expect(root.style.colorScheme).toBe('');

    // The first click switches away from what the visitor sees now.
    service.toggle();
    expect(service.isLightMode()).toBe(true);
    expect(localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBe('light');

    query.systemPrefers(false);
    expect(service.isLightMode()).toBe(true);
    expect(query.listeners.size).toBe(0);
  });

  it('should stop following the system when destroyed', () => {
    createWithPreference(true);
    expect(query.listeners.size).toBe(1);
    TestBed.resetTestingModule();
    expect(query.listeners.size).toBe(0);
  });

  it('should restore a saved choice over the system preference', () => {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, 'dark');
    const matchMedia = vi.fn(() => ({ matches: true }) as MediaQueryList);
    TestBed.configureTestingModule({
      providers: [{ provide: MediaMatcher, useValue: { matchMedia } }],
    });
    const service = TestBed.inject(ColorSchemeService);
    expect(service.isLightMode()).toBe(false);
    expect(root.style.colorScheme).toBe('dark');
    expect(matchMedia).not.toHaveBeenCalled();
  });

  it('should ignore an invalid saved value', () => {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, 'sepia');
    expect(createWithPreference(true).isLightMode()).toBe(true);
    expect(root.style.colorScheme).toBe('');
  });

  it('should still toggle when storage is blocked', () => {
    const service = createWithPreference(true);
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    try {
      service.toggle();
      expect(service.isLightMode()).toBe(false);
      expect(root.style.colorScheme).toBe('dark');
    } finally {
      setItem.mockRestore();
    }
  });

  it('should not read the browser when server-rendering', () => {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, 'light');
    const matchMedia = vi.fn(() => ({ matches: true }) as MediaQueryList);
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: MediaMatcher, useValue: { matchMedia } },
      ],
    });
    const service = TestBed.inject(ColorSchemeService);
    expect(service.isLightMode()).toBe(false);
    expect(matchMedia).not.toHaveBeenCalled();
    expect(root.style.colorScheme).toBe('');
  });
});
