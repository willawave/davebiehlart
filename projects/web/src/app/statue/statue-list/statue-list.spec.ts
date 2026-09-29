import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { MULTI_POINT_MAP } from '../../shared/multi-point-map/multi-point-map';
import { StatueStore } from '../statue.store';
import { statueItem } from '../statue.testing';
import { StatueList } from './statue-list';

describe('StatueList', () => {
  const store = {
    visibleStatueItems: signal([
      statueItem(),
      statueItem({
        id: 'scout',
        name: 'The Scout',
        location: { ...statueItem().location, latitude: 40.81, longitude: -96.7 },
      }),
    ]),
    loading: signal(false),
    error: signal<string | null>(null),
    loadVisible: vi.fn(() => Promise.resolve()),
  };
  let selectPin: (id: string) => void;
  const createMap = vi.fn(
    (_target: HTMLElement, _points: unknown, selected: (id: string) => void) => {
      selectPin = selected;
      return { setPoints: vi.fn(), destroy: vi.fn() };
    },
  );

  async function render() {
    const fixture = TestBed.createComponent(StatueList);
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    store.loading.set(false);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: StatueStore, useValue: store },
        { provide: MULTI_POINT_MAP, useValue: () => Promise.resolve(createMap) },
      ],
    });
  });

  it('should load the statues and list them under a map of where they stand', async () => {
    const { element } = await render();

    expect(store.loadVisible).toHaveBeenCalled();
    expect(element.querySelector('h1')?.textContent).toBe('Statues');
    const cards = element.querySelectorAll('a.card');
    expect(cards.length).toBe(2);
    expect(cards[0].querySelector('.year')?.textContent).toBe('2019');

    const map = element.querySelector('app-multi-point-map [role="region"]');
    expect(map?.getAttribute('aria-label')).toContain('Every statue is also listed below.');
    expect(createMap.mock.calls[0][1]).toEqual([
      { id: 'pioneer', name: 'The Pioneer', latitude: 41.258, longitude: -95.938 },
      { id: 'scout', name: 'The Scout', latitude: 40.81, longitude: -96.7 },
    ]);
  });

  it('should open the statue whose pin is clicked', async () => {
    await render();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    selectPin('scout');
    expect(navigate).toHaveBeenCalledWith(['scout'], expect.anything());
  });

  it('should hold the map’s place while loading, and skip the map when there is nothing', async () => {
    store.loading.set(true);
    const { fixture, element } = await render();
    expect(element.querySelector('app-statue-list-skeleton')).not.toBeNull();
    expect(element.querySelector('app-multi-point-map')).toBeNull();

    store.loading.set(false);
    store.visibleStatueItems.set([]);
    await fixture.whenStable();
    expect(element.querySelector('app-statue-list-skeleton')).toBeNull();
    expect(element.querySelector('app-multi-point-map')).toBeNull();
    expect(element.textContent).toContain('Nothing here yet');
  });

  it('should set its fixed description and share tags', () => {
    TestBed.createComponent(StatueList);
    const meta = TestBed.inject(Meta);
    expect(meta.getTag("name='description'")?.content).toBe(
      'Public bronze statues by artist Dave Biehl, and where to find them.',
    );
    expect(meta.getTag("property='og:url'")?.content).toBe('https://davebiehlart.com/statues');
  });
});
