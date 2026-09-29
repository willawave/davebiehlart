// Every stored photo is smaller than this. Must match the upload limit in storage.rules.
export const MAX_STORED_BYTES = 1024 * 1024;
// Longest edge the site ever shows a photo at; larger photos are scaled down to it.
export const MAX_IMAGE_EDGE = 2400;
// The smallest edge a photo may be shrunk to while hunting for a size under the limit.
const MIN_IMAGE_EDGE = 600;
const JPEG_QUALITIES = [0.85, 0.75, 0.65, 0.55];
const EDGE_STEP = 0.8;

function encode(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function draw(bitmap: ImageBitmap, edge: number, background?: string): HTMLCanvasElement {
  const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot resize images.');
  if (background) {
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

// Returns the photo as it will be stored: always under MAX_STORED_BYTES, and no larger than
// MAX_IMAGE_EDGE on its longest side.
//
// - A file already under the limit and the edge stays exactly as picked. A GIF or AVIF under
//   the limit isn't even decoded, so small animations survive.
// - A PNG is kept as PNG when that fits once scaled, so transparency survives.
// - Anything else becomes JPEG (every browser can encode it at a chosen quality): quality
//   steps down first, then the size, until it fits. Transparency is flattened onto white and
//   an animated GIF keeps its first frame. EXIF rotation is applied by createImageBitmap.
export async function resizeImage(file: File): Promise<Blob> {
  const small = file.size < MAX_STORED_BYTES;
  if (small && (file.type === 'image/gif' || file.type === 'image/avif')) {
    return file;
  }
  const bitmap = await createImageBitmap(file);
  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    if (small && longest <= MAX_IMAGE_EDGE) {
      return file;
    }
    let edge = Math.min(longest, MAX_IMAGE_EDGE);
    if (file.type === 'image/png') {
      const png = await encode(draw(bitmap, edge), 'image/png');
      if (png && png.size < MAX_STORED_BYTES) return png;
    }
    for (;;) {
      const canvas = draw(bitmap, edge, '#fff');
      for (const quality of JPEG_QUALITIES) {
        const jpeg = await encode(canvas, 'image/jpeg', quality);
        if (jpeg && jpeg.size < MAX_STORED_BYTES) return jpeg;
      }
      if (edge <= MIN_IMAGE_EDGE) break;
      edge = Math.max(MIN_IMAGE_EDGE, Math.round(edge * EDGE_STEP));
    }
    throw new Error(`${file.name} could not be shrunk under 1 MB.`);
  } finally {
    bitmap.close();
  }
}
