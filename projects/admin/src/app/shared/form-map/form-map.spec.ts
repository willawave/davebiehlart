import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormMap, LOCATION_PICKER } from './form-map';
import { LonLat, roundCoordinate } from './location-picker';

describe('FormMap', () => {
  let fixture: ComponentFixture<FormMap>;
  let moved: (position: LonLat) => void;
  const picker = { place: vi.fn(), setEnabled: vi.fn(), destroy: vi.fn() };
  const create = vi.fn((_target: HTMLElement, _start: LonLat, onMove: (p: LonLat) => void) => {
    moved = onMove;
    return picker;
  });

  async function render(load: () => Promise<unknown> = () => Promise.resolve(create)) {
    TestBed.configureTestingModule({ providers: [{ provide: LOCATION_PICKER, useValue: load }] });
    fixture = TestBed.createComponent(FormMap);
    fixture.componentRef.setInput('latitude', 41.28);
    fixture.componentRef.setInput('longitude', -96.24);
    fixture.componentRef.setInput('label', 'Statue location');
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  }

  beforeEach(() => vi.clearAllMocks());

  it('should open the map at the current coordinates and name it', async () => {
    await render();
    const map = fixture.nativeElement.querySelector('.map');
    expect(create).toHaveBeenCalledWith(map, { latitude: 41.28, longitude: -96.24 }, moved);
    expect(map.getAttribute('aria-label')).toBe('Statue location map');
  });

  it('should set both coordinates when the pin moves', async () => {
    await render();
    moved({ latitude: 40.8, longitude: -96.7 });
    expect(fixture.componentInstance.latitude()).toBe(40.8);
    expect(fixture.componentInstance.longitude()).toBe(-96.7);
  });

  it('should move the pin to typed coordinates, ignoring cleared or impossible ones', async () => {
    await render();
    picker.place.mockClear();

    fixture.componentRef.setInput('latitude', 42.5);
    await fixture.whenStable();
    expect(picker.place).toHaveBeenLastCalledWith({ latitude: 42.5, longitude: -96.24 });

    picker.place.mockClear();
    fixture.componentRef.setInput('latitude', null);
    await fixture.whenStable();
    fixture.componentRef.setInput('latitude', 95);
    await fixture.whenStable();
    expect(picker.place).not.toHaveBeenCalled();
  });

  it('should keep the pin still while disabled', async () => {
    await render();
    expect(picker.setEnabled).toHaveBeenLastCalledWith(true);

    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    expect(picker.setEnabled).toHaveBeenLastCalledWith(false);
    expect(fixture.nativeElement.querySelector('.map').getAttribute('aria-disabled')).toBe('true');
    moved({ latitude: 40.8, longitude: -96.7 });
    expect(fixture.componentInstance.latitude()).toBe(41.28);
    expect(fixture.componentInstance.longitude()).toBe(-96.24);

    fixture.componentRef.setInput('disabled', false);
    await fixture.whenStable();
    expect(picker.setEnabled).toHaveBeenLastCalledWith(true);
    moved({ latitude: 40.8, longitude: -96.7 });
    expect(fixture.componentInstance.latitude()).toBe(40.8);
  });

  it('should take the map down with the form', async () => {
    await render();
    fixture.destroy();
    expect(picker.destroy).toHaveBeenCalled();
  });

  it('should point to the coordinate inputs when the map cannot load', async () => {
    await render(() => Promise.reject(new Error('offline')));
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Type the coordinates instead.',
    );
  });
});

describe('roundCoordinate', () => {
  it('should keep six decimals', () => {
    expect(roundCoordinate(41.282797313912084)).toBe(41.282797);
    expect(roundCoordinate(-96.23715453945961)).toBe(-96.237155);
  });
});
