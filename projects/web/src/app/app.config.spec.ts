import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Route } from '@angular/router';
import { EMULATOR_FIREBASE_ENVIRONMENT } from 'core';
import { FIREBASE_APP } from 'core/firebase';
import { deleteApp, getApps } from 'firebase/app';
import { lastValueFrom, of, throwError } from 'rxjs';
import { appConfig, PreloadAfterHydration } from './app.config';

describe('appConfig', () => {
  afterEach(async () => {
    await Promise.all(getApps().map((app) => deleteApp(app)));
  });

  // Tests build with the development configuration, so this proves its fileReplacements
  // swap in the emulator environment and that it passes the development-build guard.
  it('should point development builds at the demo- emulator project', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
    expect(TestBed.inject(FIREBASE_APP).options.projectId).toBe(
      EMULATOR_FIREBASE_ENVIRONMENT.options.projectId,
    );
  });
});

describe('PreloadAfterHydration', () => {
  function strategy(platform: 'browser' | 'server'): PreloadAfterHydration {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: platform }] });
    return TestBed.inject(PreloadAfterHydration);
  }

  it('should load the route in the browser', async () => {
    const load = vi.fn(() => of('chunk'));
    await expect(lastValueFrom(strategy('browser').preload({} as Route, load))).resolves.toBe(
      'chunk',
    );
    expect(load).toHaveBeenCalledOnce();
  });

  // An error would end the router's preloading, so later routes would never preload.
  it('should skip a route whose chunk fails to load', async () => {
    const failed = throwError(() => new Error('offline'));
    await expect(
      lastValueFrom(
        strategy('browser').preload({} as Route, () => failed),
        { defaultValue: 'skipped' },
      ),
    ).resolves.toBe('skipped');
  });

  it('should not preload on the server', async () => {
    const load = vi.fn(() => of('chunk'));
    await lastValueFrom(strategy('server').preload({} as Route, load), { defaultValue: null });
    expect(load).not.toHaveBeenCalled();
  });
});
