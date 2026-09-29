import { DayHours, ScheduleDocument } from '../models/schedule.model';
import { formatDayHours, formatHour, groupWeek, todayIndex, todayStatus } from './schedule-hours';

const open = (openAt: string, close: string): DayHours => ({
  open: openAt,
  close,
  isClosed: false,
});
const closed: DayHours = { open: '10:00', close: '18:00', isClosed: true };

// Mon–Thu 10–6, Fri–Sat 10–7, Sunday closed.
const studio: ScheduleDocument = {
  0: closed,
  1: open('10:00', '18:00'),
  2: open('10:00', '18:00'),
  3: open('10:00', '18:00'),
  4: open('10:00', '18:00'),
  5: open('10:00', '19:00'),
  6: open('10:00', '19:00'),
  specialMessage: null,
};

describe('formatHour', () => {
  it.each([
    ['10:00', '10 AM'],
    ['00:00', '12 AM'],
    ['12:00', '12 PM'],
    ['18:30', '6:30 PM'],
  ])('formats %s as %s', (time, expected) => {
    expect(formatHour(time)).toBe(expected);
  });
});

describe('formatDayHours', () => {
  it('shows the opening and closing times', () => {
    expect(formatDayHours(open('09:30', '17:00'))).toBe('9:30 AM – 5 PM');
  });

  it('shows a closed or missing day as Closed', () => {
    expect(formatDayHours(closed)).toBe('Closed');
    expect(formatDayHours(undefined)).toBe('Closed');
  });
});

describe('todayIndex', () => {
  it('uses Central Time, not UTC', () => {
    // Tuesday 03:00 UTC is still Monday evening in Nebraska.
    expect(todayIndex(new Date('2026-09-29T03:00:00Z'))).toBe(1);
    expect(todayIndex(new Date('2026-09-29T06:00:00Z'))).toBe(2);
  });

  it('numbers Sunday 0', () => {
    expect(todayIndex(new Date('2026-10-04T18:00:00Z'))).toBe(0);
  });
});

describe('todayStatus', () => {
  it('shows the hours on an open day', () => {
    expect(todayStatus(studio, new Date('2026-10-02T18:00:00Z'))).toBe('Open today, 10 AM – 7 PM');
  });

  it('says closed on a closed day', () => {
    expect(todayStatus(studio, new Date('2026-10-04T18:00:00Z'))).toBe('Closed today');
  });
});

describe('groupWeek', () => {
  it('merges neighbouring days with the same hours, Monday first', () => {
    expect(groupWeek(studio)).toEqual([
      {
        label: 'Mon – Thu',
        fullLabel: 'Monday to Thursday',
        hours: '10 AM – 6 PM',
        days: [1, 2, 3, 4],
      },
      { label: 'Fri – Sat', fullLabel: 'Friday to Saturday', hours: '10 AM – 7 PM', days: [5, 6] },
      { label: 'Sun', fullLabel: 'Sunday', hours: 'Closed', days: [0] },
    ]);
  });

  it('keeps days with the same hours apart when another day comes between them', () => {
    const schedule = { ...studio, 3: closed };
    expect(groupWeek(schedule).map((group) => group.label)).toEqual([
      'Mon – Tue',
      'Wed',
      'Thu',
      'Fri – Sat',
      'Sun',
    ]);
  });

  it('merges a whole week of the same hours into one row', () => {
    const allClosed = {
      ...studio,
      1: closed,
      2: closed,
      3: closed,
      4: closed,
      5: closed,
      6: closed,
    };
    expect(groupWeek(allClosed)).toEqual([
      {
        label: 'Mon – Sun',
        fullLabel: 'Monday to Sunday',
        hours: 'Closed',
        days: [1, 2, 3, 4, 5, 6, 0],
      },
    ]);
  });

  it('treats closed days with different stored times as the same', () => {
    const schedule = { ...studio, 6: { ...closed, open: '08:00' } };
    expect(groupWeek(schedule).map((group) => group.label)).toEqual([
      'Mon – Thu',
      'Fri',
      'Sat – Sun',
    ]);
  });
});
