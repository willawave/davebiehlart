import {
  DAY_NAMES,
  DayHours,
  DayIndex,
  ScheduleDocument,
  WEEK_ORDER,
} from '../models/schedule.model';
import { formatEventTime } from './event-time';

// The gallery is in Elkhorn, Nebraska, so "today" is Central Time wherever the page renders
// (the SSR server runs in UTC).
export const GALLERY_TIME_ZONE = 'America/Chicago';

// "10:00" → "10 AM", "18:30" → "6:30 PM".
export function formatHour(time: string): string {
  return formatEventTime(time).replace(/:00 (AM|PM)$/, ' $1');
}

// "10 AM – 6 PM", or "Closed". A day missing from the document counts as closed.
export function formatDayHours(day: DayHours | undefined): string {
  return !day || day.isClosed ? 'Closed' : `${formatHour(day.open)} – ${formatHour(day.close)}`;
}

// The day of the week it is at the gallery.
export function todayIndex(now: Date, timeZone = GALLERY_TIME_ZONE): DayIndex {
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone }).format(now);
  return DAY_NAMES.indexOf(weekday as (typeof DAY_NAMES)[number]) as DayIndex;
}

// "Open today, 10 AM – 6 PM" or "Closed today".
export function todayStatus(schedule: ScheduleDocument, now: Date): string {
  const hours = schedule[todayIndex(now)];
  return !hours || hours.isClosed ? 'Closed today' : `Open today, ${formatDayHours(hours)}`;
}

export interface HoursGroup {
  // "Mon", or a run like "Mon – Thu".
  label: string;
  // The same run spelled out for screen readers: "Monday to Thursday".
  fullLabel: string;
  hours: string;
  days: DayIndex[];
}

// The week, Monday first, with neighbouring days that keep the same hours merged into one row.
export function groupWeek(schedule: ScheduleDocument): HoursGroup[] {
  const groups: HoursGroup[] = [];
  for (const day of WEEK_ORDER) {
    const hours = formatDayHours(schedule[day]);
    const last = groups.at(-1);
    if (last && last.hours === hours) {
      last.days.push(day);
    } else {
      groups.push({ label: '', fullLabel: '', hours, days: [day] });
    }
  }
  for (const group of groups) {
    const first = DAY_NAMES[group.days[0]];
    const end = DAY_NAMES[group.days[group.days.length - 1]];
    const single = group.days.length === 1;
    group.label = single ? first.slice(0, 3) : `${first.slice(0, 3)} – ${end.slice(0, 3)}`;
    group.fullLabel = single ? first : `${first} to ${end}`;
  }
  return groups;
}
