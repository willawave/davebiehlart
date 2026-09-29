import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LOCATION_PICKER } from '../../shared/form-map/form-map';
import { LonLat } from '../../shared/form-map/location-picker';
import { EventFormValue } from '../event.service';
import { EventForm } from './event-form';

const VALID: EventFormValue = {
  date: new Date('2026-10-10T05:00:00Z'),
  description: 'Meet the artist.',
  link: '',
  location: {
    city: 'Elkhorn',
    latitude: 41.283,
    longitude: -96.237,
    state: 'Nebraska',
    street: '',
    venue: 'Main Street Studios',
  },
  name: 'Open Studio',
  time: '18:30',
  visible: true,
};

describe('EventForm', () => {
  let fixture: ComponentFixture<EventForm>;
  let element: HTMLElement;
  let movePin: (position: LonLat) => void;
  const picker = { place: vi.fn(), setEnabled: vi.fn(), destroy: vi.fn() };
  const createPicker = (_target: HTMLElement, _start: LonLat, moved: (p: LonLat) => void) => {
    movePin = moved;
    return picker;
  };
  const saved = vi.fn();

  async function create(initial?: EventFormValue) {
    TestBed.configureTestingModule({
      providers: [{ provide: LOCATION_PICKER, useValue: () => Promise.resolve(createPicker) }],
    });
    fixture = TestBed.createComponent(EventForm);
    fixture.componentRef.setInput('initial', initial);
    fixture.componentInstance.saved.subscribe(saved);
    element = fixture.nativeElement;
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
  }

  const coordinates = () =>
    Array.from(element.querySelectorAll<HTMLInputElement>('input[type="number"]'));
  const input = (selector: string) => {
    const found = element.querySelector<HTMLInputElement>(selector);
    if (!found) throw new Error(`no ${selector}`);
    return found;
  };

  async function type(target: HTMLInputElement, value: string) {
    target.value = value;
    target.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function submit() {
    element.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  }

  beforeEach(() => vi.clearAllMocks());

  it('should start a new event at the studio, with no time or link', async () => {
    await create();
    const [latitude, longitude] = coordinates();
    expect(Number(latitude.value)).toBeCloseTo(41.2828, 3);
    expect(Number(longitude.value)).toBeCloseTo(-96.2372, 3);
    expect(input('input[type="time"]').value).toBe('');
    expect(input('input[type="url"]').value).toBe('');
  });

  it('should refuse to save an empty event and say what is missing', async () => {
    await create({
      ...VALID,
      name: ' ',
      time: '',
      location: { ...VALID.location, venue: '', city: '' },
    });
    await submit();

    expect(saved).not.toHaveBeenCalled();
    const text = element.textContent ?? '';
    expect(text).toContain('Enter a name.');
    expect(text).toContain('Enter the start time.');
    expect(text).toContain('Enter a venue.');
    expect(text).toContain('Enter a city.');
  });

  it('should refuse a link that is not a full web address', async () => {
    await create(VALID);
    await type(input('input[type="url"]'), 'example.com/tickets');
    await submit();

    expect(saved).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Enter a full web address, starting with https://.');
  });

  it('should reject coordinates that are cleared or off the globe', async () => {
    await create(VALID);
    const [latitude, longitude] = coordinates();
    await type(latitude, '91');
    await type(longitude, '');
    await submit();

    expect(saved).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Enter a latitude from -90 to 90.');
    expect(element.textContent).toContain('Enter a longitude.');
  });

  it('should save a complete event, with or without a link', async () => {
    await create(VALID);
    await submit();
    expect(saved).toHaveBeenLastCalledWith(VALID);

    await type(input('input[type="url"]'), 'https://example.test/tickets');
    await submit();
    expect(saved).toHaveBeenLastCalledWith({ ...VALID, link: 'https://example.test/tickets' });
  });

  it('should take the location from the map', async () => {
    await create(VALID);
    movePin({ latitude: 40.8136, longitude: -96.7026 });
    await fixture.whenStable();

    const [latitude, longitude] = coordinates();
    expect(latitude.value).toBe('40.8136');
    expect(longitude.value).toBe('-96.7026');
    await submit();
    expect(saved).toHaveBeenCalledWith({
      ...VALID,
      location: { ...VALID.location, latitude: 40.8136, longitude: -96.7026 },
    });
  });

  it('should lock every field while a save is running', async () => {
    await create(VALID);
    fixture.componentRef.setInput('saving', true);
    await fixture.whenStable();

    const inputs = Array.from(element.querySelectorAll<HTMLInputElement>('input[matInput]'));
    expect(inputs.length).toBe(10);
    expect(inputs.every((field) => field.disabled)).toBe(true);
    expect(element.querySelector('textarea')?.disabled).toBe(true);
    expect(
      Array.from(element.querySelectorAll<HTMLButtonElement>('button')).every((b) => b.disabled),
    ).toBe(true);

    // The map too: a pin moved now would miss the save and be silently dropped.
    expect(picker.setEnabled).toHaveBeenLastCalledWith(false);
    movePin({ latitude: 40.8136, longitude: -96.7026 });
    await fixture.whenStable();
    expect(coordinates()[0].value).toBe('41.283');
  });

  it('should mark the required fields', async () => {
    await create();
    // Name, description, date, time, venue, city, state, latitude, longitude.
    expect(element.querySelectorAll('.mat-mdc-form-field-required-marker').length).toBe(9);
  });
});
