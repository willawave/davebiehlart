import { TestBed } from '@angular/core/testing';
import { EMULATOR_FIREBASE_ENVIRONMENT, FIREBASE_APP } from 'core';
import { deleteApp, getApps } from 'firebase/app';
import { appConfig } from './app.config';

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
