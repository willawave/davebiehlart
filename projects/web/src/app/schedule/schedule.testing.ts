import { ScheduleDocument } from 'core';

// Spec-only fixture: Mon–Thu 10–6, Fri–Sat 10–7, Sunday closed, like the emulator seed.
export function studioSchedule(overrides: Partial<ScheduleDocument> = {}): ScheduleDocument {
  const open = (close: string) => ({ open: '10:00', close, isClosed: false });
  return {
    id: 'seed-schedule',
    0: { open: '10:00', close: '18:00', isClosed: true },
    1: open('18:00'),
    2: open('18:00'),
    3: open('18:00'),
    4: open('18:00'),
    5: open('19:00'),
    6: open('19:00'),
    specialMessage: null,
    ...overrides,
  };
}
