import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LOCATION_PICKER } from '../../shared/form-map/form-map';
import { LonLat } from '../../shared/form-map/location-picker';
import { StatueFormValue } from '../statue.service';
import { StatueStore } from '../statue.store';
import { StatueForm } from './statue-form';

const VALID: StatueFormValue = {
  dedicated: new Date('2019-06-01T07:00:00Z'),
  description: 'Cast bronze.',
  imageUrls: ['a.jpg', 'b.jpg'],
  location: {
    city: 'Omaha',
    latitude: 41.258,
    longitude: -95.938,
    state: 'Nebraska',
    street: '',
    venue: 'Gene Leahy Mall',
  },
  name: 'Pioneer',
  storageKey: 'key-1',
  visible: true,
};

describe('StatueForm', () => {
  let fixture: ComponentFixture<StatueForm>;
  let element: HTMLElement;
  let movePin: (position: LonLat) => void;
  const store = {
    uploadImages: vi.fn<(files: File[], key: string) => Promise<string[] | null>>(),
    discardImages: vi.fn(() => Promise.resolve()),
  };
  const picker = { place: vi.fn(), destroy: vi.fn() };
  const createPicker = (_target: HTMLElement, _start: LonLat, moved: (p: LonLat) => void) => {
    movePin = moved;
    return picker;
  };
  const saved = vi.fn();
  const uploaded = vi.fn();

  async function create(initial?: StatueFormValue) {
    TestBed.configureTestingModule({
      providers: [
        { provide: StatueStore, useValue: store },
        { provide: LOCATION_PICKER, useValue: () => Promise.resolve(createPicker) },
      ],
    });
    fixture = TestBed.createComponent(StatueForm);
    fixture.componentRef.setInput('storageKey', 'key-1');
    fixture.componentRef.setInput('initial', initial);
    fixture.componentInstance.saved.subscribe(saved);
    fixture.componentInstance.uploaded.subscribe(uploaded);
    element = fixture.nativeElement;
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
  }

  const coordinates = () =>
    Array.from(element.querySelectorAll<HTMLInputElement>('input[type="number"]'));

  async function type(input: HTMLInputElement, value: string) {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function submit() {
    element.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  }

  beforeEach(() => vi.clearAllMocks());

  it('should start a new statue at the studio, with no photos', async () => {
    await create();
    const [latitude, longitude] = coordinates();
    expect(Number(latitude.value)).toBeCloseTo(41.2828, 3);
    expect(Number(longitude.value)).toBeCloseTo(-96.2372, 3);
    expect(element.querySelectorAll('.photos img').length).toBe(0);
  });

  it('should refuse to save an empty statue and say what is missing', async () => {
    await create({
      ...VALID,
      name: ' ',
      imageUrls: [],
      location: { ...VALID.location, venue: '', city: '' },
    });
    await submit();

    expect(saved).not.toHaveBeenCalled();
    const text = element.textContent ?? '';
    expect(text).toContain('Enter a name.');
    expect(text).toContain('Enter a venue.');
    expect(text).toContain('Enter a city.');
    expect(text).toContain('Upload at least one photo.');
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

  it('should save a complete statue', async () => {
    await create(VALID);
    await submit();
    expect(saved).toHaveBeenCalledWith(VALID);
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

  it('should move the pin to typed coordinates', async () => {
    await create(VALID);
    await type(coordinates()[0], '42.1');
    expect(picker.place).toHaveBeenLastCalledWith({ latitude: 42.1, longitude: -95.938 });
  });

  it('should upload picked photos to the statue folder and add them to the end', async () => {
    store.uploadImages.mockResolvedValue(['new.jpg']);
    await create(VALID);
    const photo = new File(['x'], 'new.jpg', { type: 'image/jpeg' });
    const input = element.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error('no file input');
    Object.defineProperty(input, 'files', { value: [photo] });
    input.dispatchEvent(new Event('change'));
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();

    expect(store.uploadImages).toHaveBeenCalledWith([photo], 'key-1');
    expect(uploaded).toHaveBeenCalledWith(['new.jpg']);
    expect(
      Array.from(element.querySelectorAll('.photos img'), (img) => img.getAttribute('src')),
    ).toEqual(['a.jpg', 'b.jpg', 'new.jpg']);
  });

  it('should lock every field while a save is running', async () => {
    await create(VALID);
    fixture.componentRef.setInput('saving', true);
    await fixture.whenStable();

    const inputs = Array.from(element.querySelectorAll<HTMLInputElement>('input[matInput]'));
    expect(inputs.length).toBe(8);
    expect(inputs.every((input) => input.disabled)).toBe(true);
    expect(element.querySelector('textarea')?.disabled).toBe(true);
    expect(
      Array.from(element.querySelectorAll<HTMLButtonElement>('button')).every((b) => b.disabled),
    ).toBe(true);
  });

  it('should mark the required fields', async () => {
    await create();
    // Name, description, dedicated, venue, city, state, latitude, longitude. Street is optional.
    expect(element.querySelectorAll('.mat-mdc-form-field-required-marker').length).toBe(8);
  });
});
