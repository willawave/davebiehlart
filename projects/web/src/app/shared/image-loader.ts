import { IMAGE_CONFIG, IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';
import { Provider } from '@angular/core';

// Photos in Firebase Storage are served through the web server's /img endpoint at a fixed set
// of widths (projects/web/src/image-request.ts keeps the same list), so a phone downloads a
// grid-sized photo instead of the full upload. Other images (YouTube thumbnails) pass through.
export const IMAGE_WIDTHS = [160, 240, 320, 480, 640, 960, 1280, 1920];

// Used when no width is given, e.g. the plain src fallback beside a srcset.
const DEFAULT_WIDTH = 640;

export function isStoragePhoto(src: string): boolean {
  return /^https?:\/\/[^/]+\/v0\/b\/[^/]+\/o\//.test(src);
}

export function resizedUrl(src: string, width = DEFAULT_WIDTH): string {
  return isStoragePhoto(src) ? `/img?src=${encodeURIComponent(src)}&w=${width}` : src;
}

// A srcset for a plain <img>, in the listed widths.
export function resizedSrcset(src: string, widths: number[]): string | null {
  return isStoragePhoto(src)
    ? widths.map((width) => `${resizedUrl(src, width)} ${width}w`).join(', ')
    : null;
}

export function photoLoader(config: ImageLoaderConfig): string {
  return resizedUrl(config.src, config.width);
}

export function providePhotoLoader(): Provider[] {
  return [
    { provide: IMAGE_LOADER, useValue: photoLoader },
    { provide: IMAGE_CONFIG, useValue: { breakpoints: IMAGE_WIDTHS } },
  ];
}
