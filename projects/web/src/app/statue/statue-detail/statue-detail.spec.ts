import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StatueDocument } from 'core';
import { SINGLE_POINT_MAP } from '../../shared/single-point-map/single-point-map';
import { StatueNeighbors, StatueStore } from '../statue.store';
import { statueItem } from '../statue.testing';
import { StatueDetail } from './statue-detail';

describe('StatueDetail', () => {
  const store = {
    selectedStatueItem: signal<StatueDocument | null>(statueItem()),
    neighbors: signal<StatueNeighbors>({ previous: null, next: null }),
  };
  const handle = { setPosition: vi.fn(), destroy: vi.fn() };
  const createMap = vi.fn(() => handle);

  async function render() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'statues/:id', children: [] }]),
        { provide: StatueStore, useValue: store },
        { provide: SINGLE_POINT_MAP, useValue: () => Promise.resolve(createMap) },
      ],
    });
    const fixture = TestBed.createComponent(StatueDetail);
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    store.selectedStatueItem.set(statueItem());
    store.neighbors.set({ previous: null, next: null });
  });

  it('should show the statue with its dedication, photos and address', async () => {
    const { element } = await render();

    expect(element.querySelector('h1')?.textContent).toBe('The Pioneer');
    expect(element.querySelector('.kicker')?.textContent).toContain('Dedicated June 2019');
    expect(element.querySelector('.description')?.textContent).toBe(
      'Twice life size, cast in bronze.',
    );
    expect(element.querySelectorAll('app-image-track img').length).toBe(2);
    const address = element.querySelector('address')?.textContent ?? '';
    expect(address).toContain('Gene Leahy Mall');
    expect(address).toContain('1001 Farnam St');
    expect(address).toContain('Omaha, Nebraska');
  });

  it('should map where the statue stands, and follow a change of statue', async () => {
    const { fixture, element } = await render();

    expect(createMap).toHaveBeenCalledWith(expect.any(HTMLElement), {
      latitude: 41.258,
      longitude: -95.938,
    });
    expect(
      element.querySelector('app-single-point-map [role="region"]')?.getAttribute('aria-label'),
    ).toBe('Map showing where The Pioneer stands');

    store.selectedStatueItem.set(
      statueItem({ location: { ...statueItem().location, latitude: 40.81, longitude: -96.7 } }),
    );
    await fixture.whenStable();
    expect(handle.setPosition).toHaveBeenLastCalledWith({ latitude: 40.81, longitude: -96.7 });
  });

  it('should link to the neighboring statues', async () => {
    store.neighbors.set({
      previous: statueItem({ id: 'scout', name: 'The Scout' }),
      next: null,
    });
    const { element } = await render();

    const links = element.querySelectorAll('nav[aria-label="More statues"] a');
    expect(links.length).toBe(1);
    expect(links[0].getAttribute('rel')).toBe('prev');
    expect(links[0].textContent).toContain('The Scout');
  });

  it('should leave out a missing street', async () => {
    store.selectedStatueItem.set(
      statueItem({ location: { ...statueItem().location, street: '' } }),
    );
    const { element } = await render();
    expect(element.querySelectorAll('address span').length).toBe(2);
  });
});
