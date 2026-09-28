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
