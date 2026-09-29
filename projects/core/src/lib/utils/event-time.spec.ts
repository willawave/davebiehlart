import { Timestamp } from 'firebase/firestore';
import { byEventStart, formatEventTime, isUpcoming } from './event-time';

const day = (iso: string) => Timestamp.fromDate(new Date(iso));

describe('isUpcoming', () => {
  const date = day('2026-10-10T05:00:00Z');

  it('is true before the event day', () => {
    expect(isUpcoming({ date }, Date.parse('2026-10-01T12:00:00Z'))).toBe(true);
  });

  it('stays true through the event day', () => {
    expect(isUpcoming({ date }, Date.parse('2026-10-11T04:59:00Z'))).toBe(true);
  });

  it('is false once the day has passed', () => {
    expect(isUpcoming({ date }, Date.parse('2026-10-11T05:00:00Z'))).toBe(false);
  });
});

describe('formatEventTime', () => {
  it.each([
    ['00:15', '12:15 AM'],
    ['09:30', '9:30 AM'],
    ['12:00', '12:00 PM'],
    ['19:05', '7:05 PM'],
    ['7:05', '7:05 AM'],
  ])('formats %s as %s', (time, expected) => {
    expect(formatEventTime(time)).toBe(expected);
  });

  it('shows anything else as saved', () => {
    expect(formatEventTime('')).toBe('');
    expect(formatEventTime(' Noon ')).toBe('Noon');
  });
});

describe('byEventStart', () => {
  it('sorts by day, then time of day', () => {
    const events = [
      { date: day('2026-10-11T05:00:00Z'), time: '09:00' },
      { date: day('2026-10-10T05:00:00Z'), time: '18:00' },
      { date: day('2026-10-10T05:00:00Z'), time: '9:00' },
    ];
    expect([...events].sort(byEventStart).map((e) => e.time)).toEqual(['9:00', '18:00', '09:00']);
  });
});
