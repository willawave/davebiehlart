import { StatueDocument } from 'core';
import { Timestamp } from 'firebase/firestore/lite';

// Spec-only fixture for a visible statue.
export function statueItem(overrides: Partial<StatueDocument> = {}): StatueDocument {
  return {
    id: 'pioneer',
    dedicated: Timestamp.fromDate(new Date('2019-06-01T12:00:00Z')),
    description: 'Twice life size, cast in bronze.',
    imageUrls: ['https://example.test/pioneer-1.jpg', 'https://example.test/pioneer-2.jpg'],
    location: {
      city: 'Omaha',
      latitude: 41.258,
      longitude: -95.938,
      state: 'Nebraska',
      street: '1001 Farnam St',
      venue: 'Gene Leahy Mall',
    },
    name: 'The Pioneer',
    storageKey: 'key-1',
    visible: true,
    ...overrides,
  };
}
