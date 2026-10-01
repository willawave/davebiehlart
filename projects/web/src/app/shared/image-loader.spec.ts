import { IMAGE_WIDTHS as SERVED_WIDTHS } from '../../image-request';
import { IMAGE_WIDTHS, photoLoader, resizedSrcset, resizedUrl } from './image-loader';

describe('image loader', () => {
  const photo =
    'https://firebasestorage.googleapis.com/v0/b/site.firebasestorage.app/o/gallery%2Fk%2Fa.jpg?alt=media&token=t';
  const encoded = encodeURIComponent(photo);

  it('should only ask for widths the server serves', () => {
    expect(IMAGE_WIDTHS).toEqual([...SERVED_WIDTHS]);
  });

  it('should route Storage photos through /img at the requested width', () => {
    expect(photoLoader({ src: photo, width: 480 })).toBe(`/img?src=${encoded}&w=480`);
    expect(resizedUrl(photo)).toBe(`/img?src=${encoded}&w=640`);
  });

  it('should leave other images, like YouTube stills, alone', () => {
    const still = 'https://i.ytimg.com/vi/abc/hqdefault.jpg';
    expect(photoLoader({ src: still, width: 480 })).toBe(still);
    expect(resizedSrcset(still, [480, 960])).toBeNull();
  });

  it('should build a srcset of resized copies', () => {
    expect(resizedSrcset(photo, [480, 960])).toBe(
      `/img?src=${encoded}&w=480 480w, /img?src=${encoded}&w=960 960w`,
    );
  });
});
