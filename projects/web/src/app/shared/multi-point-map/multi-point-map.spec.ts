import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MULTI_POINT_MAP, MapPoint, MultiPointMap } from './multi-point-map';

const POINTS: MapPoint[] = [
  { id: 'a', name: 'A', latitude: 41.26, longitude: -95.94 },
  { id: 'b', name: 'B', latitude: 40.81, longitude: -96.7 },
];

describe('MultiPointMap', () => {
  let fixture: ComponentFixture<MultiPointMap>;
  let selectPin: (id: string) => void;
  const handle = { setPoints: vi.fn(), destroy: vi.fn() };
  const create = vi.fn(
    (_target: HTMLElement, _points: readonly MapPoint[], selected: (id: string) => void) => {
      selectPin = selected;
      return handle;
    },
  );
  const selected = vi.fn();

  async function render(load: () => Promise<unknown> = () => Promise.resolve(create)) {
    TestBed.configureTestingModule({ providers: [{ provide: MULTI_POINT_MAP, useValue: load }] });
    fixture = TestBed.createComponent(MultiPointMap);
    fixture.componentRef.setInput('points', POINTS);
    fixture.componentRef.setInput('label', 'Map of statues');
    fixture.componentInstance.pointSelected.subscribe(selected);
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  }

  const box = () => (fixture.nativeElement as HTMLElement).querySelector('.map');

  beforeEach(() => vi.clearAllMocks());

  it('should draw the points into a labelled, focusable box', async () => {
    await render();
    expect(create).toHaveBeenCalledWith(box(), POINTS, selectPin);
    expect(box()?.getAttribute('aria-label')).toBe('Map of statues');
    expect(box()?.getAttribute('tabindex')).toBe('0');
  });

  it('should report a clicked pin', async () => {
    await render();
    selectPin('b');
    expect(selected).toHaveBeenCalledWith('b');
  });

  it('should redraw new points and take the map down with the page', async () => {
    await render();
    fixture.componentRef.setInput('points', POINTS.slice(0, 1));
    await fixture.whenStable();
    expect(handle.setPoints).toHaveBeenLastCalledWith(POINTS.slice(0, 1));

    fixture.destroy();
    expect(handle.destroy).toHaveBeenCalled();
  });

  it('should say so when the map cannot load', async () => {
    await render(() => Promise.reject(new Error('offline')));
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'The map could not be loaded.',
    );
  });
});
