import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SINGLE_POINT_MAP, SinglePointMap } from './single-point-map';

describe('SinglePointMap', () => {
  let fixture: ComponentFixture<SinglePointMap>;
  const handle = { setPosition: vi.fn(), destroy: vi.fn() };
  const create = vi.fn(() => handle);

  async function render(load: () => Promise<unknown> = () => Promise.resolve(create)) {
    TestBed.configureTestingModule({ providers: [{ provide: SINGLE_POINT_MAP, useValue: load }] });
    fixture = TestBed.createComponent(SinglePointMap);
    fixture.componentRef.setInput('latitude', 41.26);
    fixture.componentRef.setInput('longitude', -95.94);
    fixture.componentRef.setInput('label', 'Map showing where A stands');
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  }

  const box = () => (fixture.nativeElement as HTMLElement).querySelector('.map');

  beforeEach(() => vi.clearAllMocks());

  it('should center a labelled map on the point', async () => {
    await render();
    expect(create).toHaveBeenCalledWith(box(), { latitude: 41.26, longitude: -95.94 });
    expect(box()?.getAttribute('aria-label')).toBe('Map showing where A stands');
  });

  it('should move to a new point and take the map down with the page', async () => {
    await render();
    fixture.componentRef.setInput('latitude', 40.81);
    await fixture.whenStable();
    expect(handle.setPosition).toHaveBeenLastCalledWith({ latitude: 40.81, longitude: -95.94 });

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
