import { FirebaseEnvironment, STORAGE_EMULATOR_PORT } from 'core';

// What /img (server.ts, image-resize.ts) accepts. Kept apart from the resizing so it can be
// unit-tested without loading sharp's native code.

// The only widths served, so nobody can make the server produce (and the CDN store) endless
// sizes. Kept in step with the image loader's breakpoints (app/shared/image-loader.ts).
export const IMAGE_WIDTHS = [160, 240, 320, 480, 640, 960, 1280, 1920] as const;

export type ImageRequest = { source: URL; width: number } | { error: string };

// The Storage origin and path prefix of this project's photos: production's bucket, or the
// emulator's in development. Only these are ever fetched.
function photoPrefix(environment: FirebaseEnvironment): { origin: string; path: string } {
  const bucket = environment.options.storageBucket ?? '';
  return {
    origin: environment.useEmulators
      ? `http://127.0.0.1:${STORAGE_EMULATOR_PORT}`
      : 'https://firebasestorage.googleapis.com',
    path: `/v0/b/${bucket}/o/`,
  };
}

export function parseImageRequest(
  query: { src?: unknown; w?: unknown },
  environment: FirebaseEnvironment,
): ImageRequest {
  const width = Number(query.w);
  if (!(IMAGE_WIDTHS as readonly number[]).includes(width)) {
    return { error: 'unsupported width' };
  }
  if (typeof query.src !== 'string') {
    return { error: 'missing src' };
  }
  let source: URL;
  try {
    source = new URL(query.src);
  } catch {
    return { error: 'invalid src' };
  }
  const allowed = photoPrefix(environment);
  if (
    !environment.options.storageBucket ||
    source.origin !== allowed.origin ||
    source.username ||
    source.password ||
    !source.pathname.startsWith(allowed.path) ||
    source.pathname.length === allowed.path.length
  ) {
    return { error: 'src is not a photo of this site' };
  }
  return { source, width };
}
