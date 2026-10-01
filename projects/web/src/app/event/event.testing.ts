import { EventDocument } from 'core';
import { Timestamp } from 'firebase/firestore/lite';

// Spec-only fixture for a visible event.
export function eventItem(overrides: Partial<EventDocument> = {}): EventDocument {
  return {
    id: 'open-studio',
    date: Timestamp.fromDate(new Date('2026-10-10T05:00:00Z')),
    description: 'Meet the artist and see new work in progress.',
    link: 'https://example.test/open-studio',
    location: {
      city: 'Elkhorn',
      latitude: 41.283,
      longitude: -96.237,
      state: 'Nebraska',
      street: '2610 North Main Street',
      venue: 'Main Street Studios & Art Gallery',
    },
    name: 'Open Studio',
    time: '18:30',
    visible: true,
    ...overrides,
  };
}
