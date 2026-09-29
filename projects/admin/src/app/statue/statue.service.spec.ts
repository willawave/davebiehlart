import { StatueDocument } from 'core';
import { Timestamp } from 'firebase/firestore';
import { StatueFormValue, toStatueDocument, toStatueFormValue } from './statue.service';

// The Firestore and Storage calls need real SDK instances; the admin E2E suite runs them
// against the emulators, and tests/rules/ checks who may make them.
describe('statue form <-> document', () => {
  const dedicated = new Date('2019-06-01T07:00:00Z');
  const value: StatueFormValue = {
    dedicated,
    description: '  Cast bronze, twice life size.  ',
    imageUrls: ['a.jpg', 'b.jpg'],
    location: {
      city: ' Omaha ',
      latitude: 41.258,
      longitude: -95.938,
      state: ' Nebraska ',
      street: ' 1001 Farnam St ',
      venue: ' Gene Leahy Mall ',
    },
    name: ' Pioneer ',
    storageKey: 'ignored',
    visible: false,
  };

  it('should write exactly the production document shape', () => {
    const doc = toStatueDocument(value, 'key-1');
    expect(Object.keys(doc).sort()).toEqual([
      'dedicated',
      'description',
      'imageUrls',
      'location',
      'name',
      'storageKey',
      'visible',
    ]);
    expect(Object.keys(doc.location).sort()).toEqual([
      'city',
      'latitude',
      'longitude',
      'state',
      'street',
      'venue',
    ]);
    expect(doc).toEqual({
      dedicated: Timestamp.fromDate(dedicated),
      description: 'Cast bronze, twice life size.',
      imageUrls: ['a.jpg', 'b.jpg'],
      location: {
        city: 'Omaha',
        latitude: 41.258,
        longitude: -95.938,
        state: 'Nebraska',
        street: '1001 Farnam St',
        venue: 'Gene Leahy Mall',
      },
      name: 'Pioneer',
      storageKey: 'key-1',
      visible: false,
    });
    expect(doc.imageUrls).not.toBe(value.imageUrls);
    expect(doc.location).not.toBe(value.location);
  });

  it('should turn a document back into a form value', () => {
    const doc: StatueDocument = { ...toStatueDocument(value, 'key-1'), id: 'abc' };
    const form = toStatueFormValue(doc);
    expect(form).toEqual({
      ...toStatueDocument(value, 'key-1'),
      dedicated,
    });
    expect(form.location).not.toBe(doc.location);
  });

  it('should read a document saved before storageKey existed as having no folder', () => {
    const legacy = {
      ...toStatueDocument(value, ''),
      storageKey: undefined,
    } as unknown as StatueDocument;
    expect(toStatueFormValue(legacy).storageKey).toBe('');
  });
});
