import { TestBed } from '@angular/core/testing';
import { FIREBASE_STORAGE } from 'core/firebase';
import { deleteApp, initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { FileService, imageFileProblem, objectName } from './file.service';

// A real, unconnected Storage instance: ref() parses URLs locally. Uploads and deletes are
// covered by the admin E2E suite against the emulators and by tests/rules/.
const app = initializeApp(
  { projectId: 'demo-files', storageBucket: 'demo-files.appspot.com', apiKey: 'demo' },
  'file-service-spec',
);
const BUCKET = 'https://firebasestorage.googleapis.com/v0/b/demo-files.appspot.com/o';
const url = (path: string) => `${BUCKET}/${encodeURIComponent(path)}?alt=media&token=t`;

function file(name: string, type: string, size = 1000): File {
  const blob = new File(['x'], name, { type });
  Object.defineProperty(blob, 'size', { value: size });
  return blob;
}

describe('imageFileProblem', () => {
  it('should accept the raster types storage.rules allows', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']) {
      expect(imageFileProblem(file('a', type))).toBeNull();
    }
  });

  it('should reject other types and files of 20 MB or more', () => {
    expect(imageFileProblem(file('logo.svg', 'image/svg+xml'))).toMatch(/logo.svg is not/);
    expect(imageFileProblem(file('p.heic', 'image/heic'))).toMatch(/not a JPEG/);
    expect(imageFileProblem(file('big.jpg', 'image/jpeg', 20 * 1024 * 1024))).toMatch(/20 MB/);
  });
});

describe('objectName', () => {
  it('should prefix a timestamp, clean the name, and match the stored type', () => {
    expect(objectName('My Horse (1).HEIC.jpg', 'image/jpeg', 42)).toBe('42-My-Horse-1-HEIC.jpg');
    expect(objectName('photo.webp', 'image/jpeg', 7)).toBe('7-photo.jpg');
    expect(objectName('.png', 'image/png', 1)).toBe('1-image.png');
  });
});

describe('FileService', () => {
  let service: FileService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: FIREBASE_STORAGE, useValue: getStorage(app) }],
    });
    service = TestBed.inject(FileService);
  });

  afterAll(() => deleteApp(app));

  it("should own only URLs inside the item's own folder", () => {
    expect(service.isOwned(url('gallery/key-1/1-a.jpg'), 'gallery', 'key-1')).toBe(true);
    expect(service.isOwned(url('gallery/key-2/1-a.jpg'), 'gallery', 'key-1')).toBe(false);
    expect(service.isOwned(url('gallery/key-10/1-a.jpg'), 'gallery', 'key-1')).toBe(false);
    expect(service.isOwned(url('statues/key-1/1-a.jpg'), 'gallery', 'key-1')).toBe(false);
    expect(service.isOwned(url('gallery/key-1/1-a.jpg'), 'gallery', '')).toBe(false);
    expect(service.isOwned('not a url', 'gallery', 'key-1')).toBe(false);
  });

  describe('uploadImages', () => {
    // Stand-ins for the two SDK calls, so no request leaves the test.
    const internals = () =>
      service as unknown as {
        uploadOne: (path: string, blob: Blob, type: string) => Promise<string>;
        deletePath: (path: string) => Promise<void>;
        shrink: (file: File) => Promise<Blob>;
      };
    const photos = ['a.jpg', 'b.jpg', 'c.jpg'].map(
      (name) => new File(['x'], name, { type: 'image/gif' }), // GIF: uploaded as-is
    );

    it('should upload each photo into the item folder and return the URLs in order', async () => {
      const upload = vi
        .spyOn(internals(), 'uploadOne')
        .mockImplementation((path) => Promise.resolve(`url:${path}`));

      const urls = await service.uploadImages(photos, 'gallery', 'key-1');

      expect(urls).toHaveLength(3);
      expect(upload.mock.calls.map(([path]) => path)).toEqual([
        expect.stringMatching(/^gallery\/key-1\/\d+-a\.gif$/),
        expect.stringMatching(/^gallery\/key-1\/\d+-b\.gif$/),
        expect.stringMatching(/^gallery\/key-1\/\d+-c\.gif$/),
      ]);
      expect(urls[0]).toBe(`url:${upload.mock.calls[0][0]}`);
    });

    it('should delete what the batch stored, including the failed photo, and rethrow', async () => {
      const failure = new Error('getDownloadURL failed');
      const upload = vi
        .spyOn(internals(), 'uploadOne')
        .mockResolvedValueOnce('url-a')
        .mockRejectedValueOnce(failure);
      const remove = vi.spyOn(internals(), 'deletePath').mockResolvedValue();

      await expect(service.uploadImages(photos, 'gallery', 'key-1')).rejects.toBe(failure);

      expect(upload).toHaveBeenCalledTimes(2);
      expect(remove.mock.calls.map(([path]) => path)).toEqual([
        upload.mock.calls[0][0],
        upload.mock.calls[1][0],
      ]);
    });

    it('should never send a photo of 1 MB or more to Storage', async () => {
      const tooBig = new Blob(['x'], { type: 'image/jpeg' });
      Object.defineProperty(tooBig, 'size', { value: 1024 * 1024 });
      vi.spyOn(internals(), 'shrink').mockResolvedValue(tooBig);
      const upload = vi.spyOn(internals(), 'uploadOne');

      await expect(service.uploadImages(photos, 'gallery', 'key-1')).rejects.toThrow(
        'a.jpg is still 1 MB or larger after resizing.',
      );
      expect(upload).not.toHaveBeenCalled();
    });

    it('should upload what the shrink step returns, with its type', async () => {
      const shrunk = new Blob(['x'], { type: 'image/jpeg' });
      vi.spyOn(internals(), 'shrink').mockResolvedValue(shrunk);
      const upload = vi.spyOn(internals(), 'uploadOne').mockResolvedValue('url');

      await service.uploadImages([photos[0]], 'gallery', 'key-1');

      expect(upload).toHaveBeenCalledWith(
        expect.stringMatching(/^gallery\/key-1\/\d+-a\.jpg$/),
        shrunk,
        'image/jpeg',
      );
    });

    it('should still rethrow the upload error when a cleanup delete fails', async () => {
      const failure = new Error('quota');
      vi.spyOn(internals(), 'uploadOne').mockRejectedValue(failure);
      vi.spyOn(internals(), 'deletePath').mockRejectedValue(new Error('offline'));

      await expect(service.uploadImages(photos, 'gallery', 'key-1')).rejects.toBe(failure);
    });
  });

  it('should delete only owned URLs', async () => {
    const remove = vi
      .spyOn(service as unknown as { deletePath: (p: string) => Promise<void> }, 'deletePath')
      .mockResolvedValue();
    const own = url('gallery/key-1/1-a.jpg');

    await service.deleteOwnedImages([own, url('statues/key-1/a.jpg')], 'gallery', 'key-1');

    expect(remove).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledWith(own);
  });

  it('should never touch a URL outside the folder when deleting', async () => {
    // Nothing is owned, so no request is made.
    await expect(
      service.deleteOwnedImages(
        [url('statues/key-1/a.jpg'), url('gallery/other/a.jpg')],
        'gallery',
        'key-1',
      ),
    ).resolves.toBeUndefined();
  });
});
