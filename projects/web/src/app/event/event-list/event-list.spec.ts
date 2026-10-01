import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { EventDocument } from 'core';
import { Timestamp } from 'firebase/firestore/lite';
import { EventStore } from '../event.store';
import { eventItem } from '../event.testing';
import { EventList } from './event-list';

const text = (element: Element) => element.textContent?.replace(/\s+/g, ' ');

describe('EventList', () => {
  const store = {
    upcomingEvents: signal<EventDocument[]>([]),
    loading: signal(false),
    error: signal<string | null>(null),
    loadUpcoming: vi.fn(() => Promise.resolve()),
  };

  async function render() {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: EventStore, useValue: store }],
    });
    const fixture = TestBed.createComponent(EventList);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    store.upcomingEvents.set([]);
    store.loading.set(false);
    store.error.set(null);
  });

  it('should load upcoming events and describe the page', async () => {
    await render();
    expect(store.loadUpcoming).toHaveBeenCalled();
    expect(TestBed.inject(Meta).getTag("name='description'")?.content).toBe(
      'Upcoming shows, open studios and dedications with artist Dave Biehl.',
    );
  });

  it('should say when nothing is coming up, and point to the contact page', async () => {
    const { element } = await render();
    expect(element.querySelector('h1')?.textContent).toBe('Events');
    expect(element.querySelector('.empty')?.textContent).toContain('No upcoming events right now.');
    expect(element.querySelector('.empty a')?.getAttribute('href')).toBe('/contact');
    expect(element.querySelector('.events')).toBeNull();
  });

  it('should list each event with its date, time and place, linking to its page', async () => {
    store.upcomingEvents.set([
      eventItem(),
      eventItem({
        id: 'pour',
        name: 'Bronze Pour',
        time: '',
        date: Timestamp.fromDate(new Date('2026-11-14T12:00:00Z')),
      }),
    ]);
    const { element } = await render();

    const rows = element.querySelectorAll<HTMLAnchorElement>('.events a.event');
    expect(rows.length).toBe(2);
    expect(rows[0].getAttribute('href')).toBe('/open-studio');
    expect(rows[0].querySelector('.date .month')?.textContent).toBe('Oct');
    expect(rows[0].querySelector('.date .day')?.textContent).toBe('10');
    expect(rows[0].querySelector('.name')?.textContent).toBe('Open Studio');
    expect(text(rows[0])).toContain('Saturday, October 10, 2026 · 6:30 PM');
    expect(text(rows[0])).toContain('Main Street Studios & Art Gallery · Elkhorn, Nebraska');
    expect(text(rows[1])).toContain('Saturday, November 14, 2026');
    // No time: the date line ends at the date.
    expect(text(rows[1].querySelector('.meta')!)?.trim()).toBe('Saturday, November 14, 2026');
    expect(element.querySelector('.empty')).toBeNull();
  });

  it('should show loading and errors instead of the empty state', async () => {
    store.loading.set(true);
    const { fixture, element } = await render();
    expect(element.querySelector('[role="status"]')?.textContent).toBe('Loading…');
    expect(element.querySelector('.empty')).toBeNull();

    store.loading.set(false);
    store.error.set('The events could not be loaded. Please try again later.');
    await fixture.whenStable();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('could not be loaded');
    expect(element.querySelector('.empty')).toBeNull();
  });
});
