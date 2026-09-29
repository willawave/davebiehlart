import { MediaDocument, MediaFormModel } from 'core';
import { Timestamp } from 'firebase/firestore';
import { MediaFormValue, toMediaDocument, toMediaFormValue } from './media.service';

// The Firestore calls need a real SDK instance; the admin E2E suite runs them against the
// emulators, and tests/rules/ checks who may make them.
describe('media form <-> document', () => {
  const date = new Date(2026, 8, 12);
  const value: MediaFormValue = {
    date,
    description: '  A studio visit.  ',
    link: ' https://example.test/story?page=2 ',
    title: ' In the Studio ',
    visible: false,
  };

  it('should write exactly the production document shape', () => {
    const doc = toMediaDocument(value);
    expect(Object.keys(doc).sort()).toEqual(['date', 'description', 'link', 'title', 'visible']);
    expect(doc).toEqual({
      date: Timestamp.fromDate(new Date('2026-09-12T00:00:00Z')),
      description: 'A studio visit.',
      link: 'https://example.test/story?page=2',
      title: 'In the Studio',
      visible: false,
    });
  });

  it('should save any form of YouTube link as its watch URL', () => {
    expect(toMediaDocument({ ...value, link: 'https://youtu.be/dQw4w9WgXcQ?t=30' }).link).toBe(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    );
    expect(
      toMediaDocument({ ...value, link: 'https://www.youtube.com/shorts/dQw4w9WgXcQ' }).link,
    ).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  it('should refuse to write a link the site cannot show', () => {
    expect(() =>
      toMediaDocument({ ...value, link: 'https://www.youtube.com/@davebiehl' }),
    ).toThrow();
    expect(() => toMediaDocument({ ...value, link: 'javascript:alert(1)' })).toThrow();
  });

  // The picker hands over its local day; the website shows the date in UTC, so the day is
  // saved at UTC midnight whatever the admin's time zone.
  it('should save the picked calendar day at UTC midnight, whatever the time of day', () => {
    for (const picked of [new Date(2026, 8, 12), new Date(2026, 8, 12, 23, 59)]) {
      expect(toMediaDocument({ ...value, date: picked }).date).toEqual(
        Timestamp.fromDate(new Date('2026-09-12T00:00:00Z')),
      );
    }
  });

  it('should start a new item dated today', () => {
    const now = new Date();
    const saved = toMediaDocument({
      ...new MediaFormModel().mediaForm(),
      link: 'https://example.test/a',
    }).date;
    expect(saved.toDate()).toEqual(
      new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())),
    );
  });

  it('should turn a document back into a form value on the same day', () => {
    const doc: MediaDocument = { ...toMediaDocument(value), id: 'abc' };
    expect(toMediaFormValue(doc)).toEqual({ ...toMediaDocument(value), date });
  });

  it('should read an older item saved at Nebraska midnight on its day', () => {
    const doc: MediaDocument = {
      ...toMediaDocument(value),
      date: Timestamp.fromDate(new Date('2026-09-12T05:00:00Z')),
    };
    expect(toMediaFormValue(doc).date).toEqual(new Date(2026, 8, 12));
  });
});
