import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScheduleDocument } from 'core';
import { ScheduleStore } from '../schedule.store';
import { studioSchedule } from '../schedule.testing';
import { VisitHours } from './visit-hours';

describe('VisitHours', () => {
  const store = {
    schedule: signal<ScheduleDocument | null>(null),
    loadSchedule: vi.fn(() => Promise.resolve()),
  };

  async function create(now: string) {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(now));
    TestBed.configureTestingModule({ providers: [{ provide: ScheduleStore, useValue: store }] });
    const fixture = TestBed.createComponent(VisitHours);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const text = (element: HTMLElement, selector: string) =>
    element.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();

  beforeEach(() => {
    vi.clearAllMocks();
    store.schedule.set(studioSchedule());
  });

  afterEach(() => vi.useRealTimers());

  it('should load the hours', async () => {
    await create('2026-10-01T18:00:00Z');
    expect(store.loadSchedule).toHaveBeenCalledOnce();
  });

  it("should show today's hours in Central Time and mark today's row", async () => {
    // Thursday 01:00 UTC is still Wednesday evening in Elkhorn.
    const element = await create('2026-10-01T01:00:00Z');

    expect(text(element, '.kicker')).toBe('Open today, 10 AM – 6 PM');
    const spoken = [...element.querySelectorAll('.today dt .visually-hidden')].map((span) =>
      span.textContent?.trim(),
    );
    expect(spoken).toEqual(['Today,', 'Monday to Thursday']);
    expect(element.querySelectorAll('.today')).toHaveLength(1);
  });

  it('should list the week grouped, Monday first', async () => {
    const element = await create('2026-10-01T18:00:00Z');
    const rows = [...element.querySelectorAll('.hours div')].map((row) => [
      row.querySelector('dt [aria-hidden="true"]')?.textContent,
      row.querySelector('dd')?.textContent,
    ]);
    expect(rows).toEqual([
      ['Mon – Thu', '10 AM – 6 PM'],
      ['Fri – Sat', '10 AM – 7 PM'],
      ['Sun', 'Closed'],
    ]);
  });

  it('should say when the gallery is closed today', async () => {
    const element = await create('2026-10-04T18:00:00Z');
    expect(text(element, '.kicker')).toBe('Closed today');
    expect(text(element, '.today dd')).toBe('Closed');
  });

  it('should show the special message only when there is one', async () => {
    let element = await create('2026-10-01T18:00:00Z');
    expect(element.querySelector('.notice')).toBeNull();

    TestBed.resetTestingModule();
    store.schedule.set(studioSchedule({ specialMessage: 'Closed Thanksgiving Day' }));
    element = await create('2026-10-01T18:00:00Z');
    expect(text(element, '.notice')).toBe('Closed Thanksgiving Day');
  });

  it('should keep the address and drop the hours when none are saved', async () => {
    store.schedule.set(null);
    const element = await create('2026-10-01T18:00:00Z');

    expect(text(element, 'address')).toBe(
      'Main Street Studios · 2610 North Main Street, Elkhorn, Nebraska',
    );
    expect(element.querySelector('.kicker')).toBeNull();
    expect(element.querySelector('.hours')).toBeNull();
  });
});
