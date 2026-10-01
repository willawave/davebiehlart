import sharp from 'sharp';

// /img, served by server.ts: a Storage photo resized to one of a few widths. Photos are
// uploaded up to ~1,600px and 1 MB; a grid card shows them ~170px wide, so phones would
// otherwise download the full photo for every card. What /img accepts is in image-request.ts.

const FETCH_TIMEOUT_MS = 10_000;
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

export class ImageFetchError extends Error {
  constructor(
    message: string,
    readonly status: 404 | 502,
  ) {
    super(message);
  }
}

// Fetches the original (no redirects, bounded time and size) and returns a WebP of `width`,
// never enlarged, turned upright from the photo's stored orientation.
export async function resizePhoto(source: URL, width: number): Promise<Buffer> {
  const response = await fetch(source, {
    redirect: 'error',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  }).catch((error: unknown) => {
    throw new ImageFetchError(`fetch failed: ${String(error)}`, 502);
  });
  if (response.status === 404) {
    throw new ImageFetchError('photo not found', 404);
  }
  if (!response.ok || !response.body) {
    throw new ImageFetchError(`Storage answered ${response.status}`, 502);
  }
  if (!response.headers.get('content-type')?.startsWith('image/')) {
    throw new ImageFetchError('not an image', 502);
  }
  if (Number(response.headers.get('content-length') ?? 0) > MAX_SOURCE_BYTES) {
    throw new ImageFetchError('photo too large', 502);
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  for await (const chunk of response.body) {
    total += chunk.byteLength;
    if (total > MAX_SOURCE_BYTES) {
      throw new ImageFetchError('photo too large', 502);
    }
    chunks.push(chunk);
  }
  return sharp(Buffer.concat(chunks))
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer();
}
