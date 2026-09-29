import { MAX_IMAGE_EDGE, MAX_STORED_BYTES, resizeImage } from './resize-image';

const MB = MAX_STORED_BYTES;

describe('resizeImage', () => {
  const close = vi.fn();
  // Every encode, in order.
  let encodes: { width: number; height: number; type: string; quality?: number }[];
  // Size in bytes of an encoded image, by canvas size, type and quality.
  let sizeOf: (e: { width: number; height: number; type: string; quality?: number }) => number;
  let fills: string[];

  function file(name: string, type: string, size: number): File {
    const f = new File(['x'], name, { type });
    Object.defineProperty(f, 'size', { value: size });
    return f;
  }

  function stubBitmap(width: number, height: number) {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(() => Promise.resolve({ width, height, close })),
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    encodes = [];
    fills = [];
    // By default, a JPEG costs 0.4 bytes per pixel per unit of quality, and a PNG 3.
    sizeOf = ({ width, height, type, quality = 1 }) =>
      width * height * (type === 'image/png' ? 3 : 0.4 * quality);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      set fillStyle(value: string) {
        fills.push(value);
      },
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
      this: HTMLCanvasElement,
      callback: BlobCallback,
      type = 'image/png',
      quality?: number,
    ) {
      const encoded = { width: this.width, height: this.height, type, quality };
      encodes.push(encoded);
      const blob = new Blob(['x'], { type });
      Object.defineProperty(blob, 'size', { value: sizeOf(encoded) });
      callback(blob);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should keep a photo already under 1 MB and the size limit, in its own format', async () => {
    stubBitmap(MAX_IMAGE_EDGE, 1600);
    const original = file('a.webp', 'image/webp', MB - 1);
    await expect(resizeImage(original)).resolves.toBe(original);
    expect(encodes).toEqual([]);
    expect(close).toHaveBeenCalled();
  });

  it('should pass a small GIF or AVIF through without decoding it', async () => {
    stubBitmap(5000, 5000);
    for (const type of ['image/gif', 'image/avif']) {
      const original = file('a', type, MB - 1);
      await expect(resizeImage(original)).resolves.toBe(original);
    }
    expect(createImageBitmap).not.toHaveBeenCalled();
  });

  it('should step JPEG quality down until a large photo fits under 1 MB', async () => {
    stubBitmap(2400, 1600);
    // 0.4 * 2400 * 1600 = 1.5 MB at quality 1: 0.85 and 0.75 are too big, 0.65 fits.
    const result = await resizeImage(file('big.jpg', 'image/jpeg', 3 * MB));

    expect(result.type).toBe('image/jpeg');
    expect(result.size).toBeLessThan(MB);
    expect(encodes.map((e) => e.quality)).toEqual([0.85, 0.75, 0.65]);
  });

  it('should scale an oversized photo to the maximum edge first', async () => {
    stubBitmap(3000, 4800);
    sizeOf = () => 1000;
    const result = await resizeImage(file('tall.jpg', 'image/jpeg', MB - 1));

    expect(result.size).toBe(1000);
    expect(encodes[0]).toMatchObject({ width: 1500, height: MAX_IMAGE_EDGE, type: 'image/jpeg' });
  });

  it('should shrink the photo once lower quality is not enough', async () => {
    stubBitmap(2400, 2400);
    // At 2400px even quality 0.55 is 1.27 MB; at 1920px, 0.65 gives 0.96 MB.
    const result = await resizeImage(file('huge.jpg', 'image/jpeg', 8 * MB));

    expect(result.size).toBeLessThan(MB);
    expect(encodes.filter((e) => e.width === 2400)).toHaveLength(4);
    expect(encodes.at(-1)).toMatchObject({ width: 1920, height: 1920, quality: 0.65 });
  });

  it('should keep a PNG as PNG when that fits once scaled', async () => {
    stubBitmap(4000, 2000);
    sizeOf = ({ type }) => (type === 'image/png' ? MB - 1 : 10);
    const result = await resizeImage(file('logo.png', 'image/png', 2 * MB));

    expect(result.type).toBe('image/png');
    expect(encodes).toEqual([{ width: 2400, height: 1200, type: 'image/png', quality: undefined }]);
  });

  it('should turn a PNG that does not fit into JPEG on a white background', async () => {
    stubBitmap(1600, 1200);
    const result = await resizeImage(file('photo.png', 'image/png', 5 * MB));

    expect(encodes[0].type).toBe('image/png');
    expect(result.type).toBe('image/jpeg');
    expect(result.size).toBeLessThan(MB);
    expect(fills).toContain('#fff');
  });

  it('should turn a large GIF or AVIF into JPEG', async () => {
    stubBitmap(1200, 900);
    for (const type of ['image/gif', 'image/avif']) {
      const result = await resizeImage(file('a', type, 4 * MB));
      expect(result.type).toBe('image/jpeg');
      expect(result.size).toBeLessThan(MB);
    }
  });

  it('should give up with a clear error when even the smallest version is too big', async () => {
    stubBitmap(2400, 2400);
    sizeOf = () => MB;
    await expect(resizeImage(file('noise.jpg', 'image/jpeg', 9 * MB))).rejects.toThrow(
      'noise.jpg could not be shrunk under 1 MB.',
    );
    // It went all the way down to the 600px floor, then stopped.
    expect(encodes.at(-1)).toMatchObject({ width: 600, quality: 0.55 });
    expect(close).toHaveBeenCalled();
  });
});
