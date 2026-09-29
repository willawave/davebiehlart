import type { EventDocument } from '../models/event.model';

const DAY_MS = 24 * 60 * 60 * 1000;

// An event's `date` is the start of its day (the admin's datepicker saves local midnight), so
// it stays upcoming until that whole day has passed.
export function isUpcoming(event: Pick<EventDocument, 'date'>, now: number): boolean {
  return event.date.toMillis() + DAY_MS > now;
}

// "19:05" → "7:05 PM". Anything that isn't an "HH:mm" time is shown as saved.
export function formatEventTime(time: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return time.trim();
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${match[2]} ${suffix}`;
}

// Soonest first: by day, then by time of day ("HH:mm" sorts as text; no time sorts first).
export function byEventStart(
  a: Pick<EventDocument, 'date' | 'time'>,
  b: Pick<EventDocument, 'date' | 'time'>,
): number {
  return a.date.toMillis() - b.date.toMillis() || padTime(a.time).localeCompare(padTime(b.time));
}

function padTime(time: string): string {
  return time.trim().padStart(5, '0');
}
