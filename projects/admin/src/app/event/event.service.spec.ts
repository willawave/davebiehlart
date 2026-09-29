import { EventDocument, EventFormModel } from 'core';
import { Timestamp } from 'firebase/firestore';
import { EventFormValue, toEventDocument, toEventFormValue } from './event.service';

// The Firestore calls need a real SDK instance; the admin E2E suite runs them against the
// emulators, and tests/rules/ checks who may make them.
describe('event form <-> document', () => {
  const date = new Date(2026, 9, 10);
  const value: EventFormValue = {
    date,
    description: '  Meet the artist.  ',
    link: ' https://example.test/open-studio ',
    location: {
      city: ' Elkhorn ',
      latitude: 41.283,
      longitude: -96.237,
      state: ' Nebraska ',
      street: ' 2610 North Main Street ',
      venue: ' Main Street Studios ',
    },
    name: ' Open Studio ',
    time: ' 18:30 ',
    visible: false,
  };

  it('should write exactly the production document shape', () => {
    const doc = toEventDocument(value);
    expect(Object.keys(doc).sort()).toEqual([
      'date',
      'description',
      'link',
      'location',
      'name',
      'time',
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
      date: Timestamp.fromDate(date),
      description: 'Meet the artist.',
      link: 'https://example.test/open-studio',
      location: {
        city: 'Elkhorn',
        latitude: 41.283,
        longitude: -96.237,
        state: 'Nebraska',
        street: '2610 North Main Street',
        venue: 'Main Street Studios',
      },
      name: 'Open Studio',
      time: '18:30',
      visible: false,
    });
    expect(doc.location).not.toBe(value.location);
  });

  it("should save the date as the start of the admin's day", () => {
    const evening = new Date(2026, 9, 10, 21, 45, 30, 500);
    expect(toEventDocument({ ...value, date: evening }).date).toEqual(
      Timestamp.fromDate(new Date(2026, 9, 10)),
    );
  });

  it('should save the untouched default date of a new event as today at midnight', () => {
    const now = new Date();
    const saved = toEventDocument({ ...new EventFormModel().eventForm(), name: 'n' }).date;
    expect(saved.toDate()).toEqual(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  });

  it('should save a blank link as null', () => {
    expect(toEventDocument({ ...value, link: '  ' }).link).toBeNull();
  });

  it('should turn a document back into a form value', () => {
    const doc: EventDocument = { ...toEventDocument(value), id: 'abc' };
    const form = toEventFormValue(doc);
    expect(form).toEqual({ ...toEventDocument(value), date });
    expect(form.location).not.toBe(doc.location);
    expect(toEventFormValue({ ...doc, link: null }).link).toBe('');
  });
});
