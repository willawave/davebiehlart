import { MediaDocument } from 'core';
import { Timestamp } from 'firebase/firestore/lite';

// Spec-only fixtures for visible media items.
export function videoItem(overrides: Partial<MediaDocument> = {}): MediaDocument {
  return {
    id: 'on-air',
    date: Timestamp.fromDate(new Date('2026-09-12T12:00:00Z')),
    description: 'A visit to the foundry for the evening news.',
    link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'On Air at the Foundry',
    visible: true,
    ...overrides,
  };
}

export function articleItem(overrides: Partial<MediaDocument> = {}): MediaDocument {
  return {
    id: 'profile',
    date: Timestamp.fromDate(new Date('2026-06-03T12:00:00Z')),
    description: 'A profile of the sculptor and his Elkhorn studio.',
    link: 'https://www.example.com/arts/sculptor-profile',
    title: 'The Sculptor Next Door',
    visible: true,
    ...overrides,
  };
}
