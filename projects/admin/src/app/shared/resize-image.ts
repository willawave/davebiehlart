// Longest edge the site ever shows a photo at; larger uploads are scaled down to it.
export const MAX_IMAGE_EDGE = 2400;
const JPEG_QUALITY = 0.85;

// Scales a JPEG, PNG or WebP down so its longest edge is MAX_IMAGE_EDGE, in the browser.
// PNGs stay PNG (transparency); JPEG and WebP become JPEG, which every browser can encode.
// Anything already small enough, and every other type (GIF animations, AVIF, which Safari
// cannot encode), comes back unchanged. EXIF rotation is applied by createImageBitmap.
export async function resizeImage(file: File): Promise<Blob> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return file;
  }
  const bitmap = await createImageBitmap(file);
  try {
    const scale = MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height);
    if (scale >= 1) {
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (!context) {
      return file;
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, JPEG_QUALITY),
    );
    return blob ?? file;
  } finally {
    bitmap.close();
  }
}
