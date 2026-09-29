import { GalleryDocument, GalleryStyle } from 'core';
import { Timestamp } from 'firebase/firestore';

// Spec-only fixture for a visible gallery item.
export function galleryItem(overrides: Partial<GalleryDocument> = {}): GalleryDocument {
  return {
    id: 'mustang',
    created: Timestamp.fromDate(new Date('2024-03-14T12:00:00Z')),
    depth: 9,
    description: 'Cast bronze on a walnut base.',
    height: 18,
    imageUrls: ['https://example.test/mustang-1.jpg', 'https://example.test/mustang-2.jpg'],
    name: 'Mustang at Dawn',
    storageKey: 'key-1',
    style: GalleryStyle.BRONZE,
    visible: true,
    weight: 34,
    width: 22,
    ...overrides,
  };
}
