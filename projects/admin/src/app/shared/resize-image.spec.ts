import { MAX_IMAGE_EDGE, resizeImage } from './resize-image';

describe('resizeImage', () => {
  const close = vi.fn();
  let drawn: { width: number; height: number; type?: string } | undefined;

  function stubBitmap(width: number, height: number) {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(() => Promise.resolve({ width, height, close })),
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    drawn = undefined;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
      this: HTMLCanvasElement,
      callback: BlobCallback,
      type?: string,
    ) {
      drawn = { width: this.width, height: this.height, type };
      callback(new Blob(['resized'], { type }));
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should pass GIF and AVIF through untouched', async () => {
    stubBitmap(5000, 5000);
    for (const type of ['image/gif', 'image/avif']) {
      const original = new File(['x'], 'a', { type });
      await expect(resizeImage(original)).resolves.toBe(original);
    }
    expect(createImageBitmap).not.toHaveBeenCalled();
  });

  it('should keep a photo that is already small enough', async () => {
    stubBitmap(MAX_IMAGE_EDGE, 1200);
    const original = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    await expect(resizeImage(original)).resolves.toBe(original);
    expect(close).toHaveBeenCalled();
  });

  it('should scale a large portrait JPEG to the maximum edge, as JPEG', async () => {
    stubBitmap(3000, 4800);
    const result = await resizeImage(new File(['x'], 'a.jpg', { type: 'image/jpeg' }));
    expect(drawn).toEqual({ width: 1500, height: MAX_IMAGE_EDGE, type: 'image/jpeg' });
    expect(result.type).toBe('image/jpeg');
  });

  it('should turn a large WebP into JPEG but keep a PNG as PNG', async () => {
    stubBitmap(4800, 2400);
    await resizeImage(new File(['x'], 'a.webp', { type: 'image/webp' }));
    expect(drawn).toEqual({ width: MAX_IMAGE_EDGE, height: 1200, type: 'image/jpeg' });

    await resizeImage(new File(['x'], 'a.png', { type: 'image/png' }));
    expect(drawn?.type).toBe('image/png');
  });
});
