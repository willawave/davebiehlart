import { ScheduleDocument, ScheduleFormModel } from 'core';
import { ScheduleFormValue, toScheduleDocument, toScheduleFormValue } from './schedule.service';

const hours = (open: string, close: string, isClosed = false) => ({ open, close, isClosed });

// The Firestore calls need a real SDK instance; the admin E2E suite runs them against the
// emulators, and tests/rules/ checks who may make them.
describe('schedule form <-> document', () => {
  // Monday first, as the form shows the week.
  const value: ScheduleFormValue = {
    days: [
      hours('10:00', '18:00'),
      hours('10:00', '18:00'),
      hours('10:00', '18:00'),
      hours('10:00', '18:00'),
      hours('10:00', '19:00'),
      hours('09:00', '19:00'),
      hours('12:00', '16:00', true),
    ],
    specialMessage: '  Closed Thanksgiving Day  ',
  };

  it('should write exactly the production document shape, Sunday as day 0', () => {
    const doc = toScheduleDocument(value);
    expect(Object.keys(doc).sort()).toEqual(['0', '1', '2', '3', '4', '5', '6', 'specialMessage']);
    expect(doc[0]).toEqual(hours('12:00', '16:00', true));
    expect(doc[1]).toEqual(hours('10:00', '18:00'));
    expect(doc[6]).toEqual(hours('09:00', '19:00'));
    expect(doc.specialMessage).toBe('Closed Thanksgiving Day');
  });

  it('should save a blank special message as null', () => {
    expect(toScheduleDocument({ ...value, specialMessage: '   ' }).specialMessage).toBeNull();
  });

  it('should write no extra fields from a day', () => {
    const days = value.days.map((day) => ({ ...day, extra: 1 }));
    expect(Object.keys(toScheduleDocument({ ...value, days })[1]).sort()).toEqual([
      'close',
      'isClosed',
      'open',
    ]);
  });

  it('should turn a document back into the same form value', () => {
    const doc: ScheduleDocument = { ...toScheduleDocument(value), id: 'abc' };
    expect(toScheduleFormValue(doc)).toEqual({
      ...value,
      specialMessage: 'Closed Thanksgiving Day',
    });
  });

  it('should show a null message as blank and fill in a missing day', () => {
    const doc = { ...toScheduleDocument(value), specialMessage: null } as ScheduleDocument;
    delete (doc as Partial<ScheduleDocument>)[3];
    const form = toScheduleFormValue(doc);
    expect(form.specialMessage).toBe('');
    expect(form.days[2]).toEqual(new ScheduleFormModel().scheduleForm().days[2]);
  });
});
