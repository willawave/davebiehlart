import { FirebaseEnvironment } from 'core';
import { parseImageRequest } from './image-request';

describe('parseImageRequest', () => {
  const production: FirebaseEnvironment = {
    options: { projectId: 'p', storageBucket: 'site.firebasestorage.app' },
    useEmulators: false,
  };
  const emulators: FirebaseEnvironment = {
    options: { projectId: 'demo-p', storageBucket: 'demo-p.appspot.com' },
    useEmulators: true,
  };
  const photo =
    'https://firebasestorage.googleapis.com/v0/b/site.firebasestorage.app/o/gallery%2Fk%2Fa.jpg?alt=media&token=t';

  it("should accept a photo from this site's bucket at a listed width", () => {
    const request = parseImageRequest({ src: photo, w: '320' }, production);
    expect(request).toEqual({ source: new URL(photo), width: 320 });
  });

  it("should accept the emulator's photos in development only", () => {
    const local = 'http://127.0.0.1:9199/v0/b/demo-p.appspot.com/o/statues%2Fk%2Fb.jpg?alt=media';
    expect(parseImageRequest({ src: local, w: '640' }, emulators)).toMatchObject({ width: 640 });
    expect(parseImageRequest({ src: local, w: '640' }, production)).toHaveProperty('error');
    expect(parseImageRequest({ src: photo, w: '640' }, emulators)).toHaveProperty('error');
  });

  it('should reject widths outside the list, so nobody can force endless sizes', () => {
    for (const w of ['100', '321', '0', '-320', '320.5', 'abc', undefined]) {
      expect(parseImageRequest({ src: photo, w }, production)).toEqual({
        error: 'unsupported width',
      });
    }
  });

  it('should fetch nothing but this project’s photos', () => {
    // Built here rather than written out, so it doesn't read as a leaked credential.
    const withLogin = new URL(photo);
    withLogin.username = 'someone';
    withLogin.password = 'anything';
    for (const src of [
      withLogin.href,
      'https://evil.example/v0/b/site.firebasestorage.app/o/a.jpg',
      'http://firebasestorage.googleapis.com/v0/b/site.firebasestorage.app/o/a.jpg',
      'https://firebasestorage.googleapis.com.evil.example/v0/b/site.firebasestorage.app/o/a.jpg',
      'https://firebasestorage.googleapis.com/v0/b/other-bucket/o/a.jpg',
      'https://firebasestorage.googleapis.com/v0/b/site.firebasestorage.app/o/',
      'https://firebasestorage.googleapis.com/v1/b/site.firebasestorage.app/o/a.jpg',
      'http://169.254.169.254/latest/meta-data',
      'file:///etc/passwd',
      'not a url',
    ]) {
      expect(parseImageRequest({ src, w: '320' }, production), src).toHaveProperty('error');
    }
    expect(parseImageRequest({ w: '320' }, production)).toEqual({ error: 'missing src' });
    expect(parseImageRequest({ src: [photo], w: '320' }, production)).toEqual({
      error: 'missing src',
    });
  });

  it('should refuse everything when no bucket is configured', () => {
    const unconfigured = { ...production, options: { projectId: 'p' } };
    expect(parseImageRequest({ src: photo, w: '320' }, unconfigured)).toHaveProperty('error');
  });
});
