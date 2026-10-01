import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EventDocument } from 'core';
import { Timestamp } from 'firebase/firestore/lite';
import { SINGLE_POINT_MAP } from '../../shared/single-point-map/single-point-map';
import { EventStore } from '../event.store';
import { eventItem } from '../event.testing';
import { EventDetail } from './event-detail';

const DAY = 24 * 60 * 60 * 1000;
const upcoming = () => eventItem({ date: Timestamp.fromMillis(Date.now() + 30 * DAY) });

describe('EventDetail', () => {
  const store = { selectedEvent: signal<EventDocument | null>(null) };
  const handle = { setPosition: vi.fn(), destroy: vi.fn() };
  const createMap = vi.fn(() => handle);

  async function render() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: EventStore, useValue: store },
        { provide: SINGLE_POINT_MAP, useValue: () => Promise.resolve(createMap) },
      ],
    });
    const fixture = TestBed.createComponent(EventDetail);
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    store.selectedEvent.set(eventItem());
  });

  it('should show the event with its date, time, description and address', async () => {
    const { element } = await render();

    expect(element.querySelector('h1')?.textContent).toBe('Open Studio');
    expect(element.querySelector('.kicker')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Event · Saturday, October 10, 2026 · 6:30 PM',
    );
    expect(element.querySelector('.description')?.textContent).toBe(
      'Meet the artist and see new work in progress.',
    );
    const address = element.querySelector('address')?.textContent ?? '';
    expect(address).toContain('Main Street Studios & Art Gallery');
    expect(address).toContain('2610 North Main Street');
    expect(address).toContain('Elkhorn, Nebraska');
  });

  it('should link out to the event, saying it opens a new tab', async () => {
    const { element } = await render();
    const link = element.querySelector<HTMLAnchorElement>('a.link');
    expect(link?.getAttribute('href')).toBe('https://example.test/open-studio');
    expect(link?.target).toBe('_blank');
    expect(link?.rel).toBe('noopener');
    expect(link?.textContent).toContain('(opens in a new tab)');
  });

  it('should leave out an empty link, time and street', async () => {
    store.selectedEvent.set(
      eventItem({ link: null, time: '', location: { ...eventItem().location, street: '' } }),
    );
    const { element } = await render();
    expect(element.querySelector('a.link')).toBeNull();
    expect(element.querySelector('.kicker')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Event · Saturday, October 10, 2026',
    );
    expect(element.querySelectorAll('address span').length).toBe(2);
  });

  it('should say a past event has ended, and not an upcoming one', async () => {
    store.selectedEvent.set(eventItem({ date: Timestamp.fromMillis(Date.now() - 2 * DAY) }));
    const { fixture, element } = await render();
    expect(element.querySelector('.ended')?.textContent).toContain('This event has ended.');
    expect(element.querySelector('.ended a')?.getAttribute('href')).toBe('/');

    store.selectedEvent.set(upcoming());
    await fixture.whenStable();
    expect(element.querySelector('.ended')).toBeNull();
  });

  it('should map where the event takes place', async () => {
    const { element } = await render();
    expect(createMap).toHaveBeenCalledWith(expect.any(HTMLElement), {
      latitude: 41.283,
      longitude: -96.237,
    });
    expect(
      element.querySelector('app-single-point-map [role="region"]')?.getAttribute('aria-label'),
    ).toBe('Map showing where Open Studio takes place');
  });
});
