import { MediaMatcher } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { ColorSchemeService } from './color-scheme.service';

function createWithPreference(prefersLight: boolean): ColorSchemeService {
  const matchMedia = vi.fn(() => ({ matches: prefersLight }) as MediaQueryList);
  TestBed.configureTestingModule({
    providers: [{ provide: MediaMatcher, useValue: { matchMedia } }],
  });
  const service = TestBed.inject(ColorSchemeService);
  expect(matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: light)');
  return service;
}

describe('ColorSchemeService', () => {
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
});
