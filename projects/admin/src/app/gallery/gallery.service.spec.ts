import { GalleryDocument, GalleryStyle } from 'core';
import { Timestamp } from 'firebase/firestore';
import { GalleryFormValue, toGalleryDocument, toGalleryFormValue } from './gallery.service';

// The Firestore and Storage calls need real SDK instances; the admin E2E suite runs them
// against the emulators, and tests/rules/ checks who may make them.
describe('gallery form <-> document', () => {
  const created = new Date('2024-03-14T07:00:00Z');
  const value: GalleryFormValue = {
    created,
    depth: 9,
    description: '  Cast bronze.  ',
    height: 18,
    imageUrls: ['a.jpg', 'b.jpg'],
    name: ' Mustang ',
    storageKey: 'ignored',
    style: GalleryStyle.BRONZE,
    visible: false,
    weight: null,
    width: 22.5,
  };

  it('should write exactly the production document shape', () => {
    const doc = toGalleryDocument(value, 'key-1');
    expect(Object.keys(doc).sort()).toEqual([
      'created',
      'depth',
      'description',
      'height',
      'imageUrls',
      'name',
      'storageKey',
      'style',
      'visible',
      'weight',
      'width',
    ]);
    expect(doc).toEqual({
      created: Timestamp.fromDate(created),
      depth: 9,
      description: 'Cast bronze.',
      height: 18,
      imageUrls: ['a.jpg', 'b.jpg'],
      name: 'Mustang',
      storageKey: 'key-1',
      style: GalleryStyle.BRONZE,
      visible: false,
      weight: null,
      width: 22.5,
    });
    expect(doc.imageUrls).not.toBe(value.imageUrls);
  });

  it('should turn a document back into a form value', () => {
    const doc: GalleryDocument = { ...toGalleryDocument(value, 'key-1'), id: 'abc' };
    expect(toGalleryFormValue(doc)).toEqual({
      ...value,
      description: 'Cast bronze.',
      name: 'Mustang',
      storageKey: 'key-1',
    });
  });

  it('should read a legacy document without a weight as no weight', () => {
    const legacy = {
      ...toGalleryDocument(value, ''),
      weight: undefined,
    } as unknown as GalleryDocument;
    expect(toGalleryFormValue(legacy).weight).toBeNull();
  });
});
