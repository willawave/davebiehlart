import {
  Component,
  DestroyRef,
  ElementRef,
  InjectionToken,
  afterNextRender,
  effect,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import type { LocationPicker, createLocationPicker } from './location-picker';

// Loads OpenLayers on demand, so it stays out of the form's first render. Specs provide a
// stand-in, since jsdom can't draw a map.
export const LOCATION_PICKER = new InjectionToken<() => Promise<typeof createLocationPicker>>(
  'LOCATION_PICKER',
  {
    providedIn: 'root',
    factory: () => () => import('./location-picker').then((m) => m.createLocationPicker),
  },
);

// A cleared number input holds null at runtime, whatever the model's type says.
function isPosition(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  );
}

// A map for setting a latitude and longitude: click to move the pin, or drag it. Scroll or
// pinch to zoom. Typed coordinates move the pin too. The map is a convenience; the form's
// latitude and longitude inputs are the accessible way to set the same values.
@Component({
  selector: 'app-form-map',
  styleUrl: './form-map.scss',
  templateUrl: './form-map.html',
})
export class FormMap {
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('map');
  private readonly loadPicker = inject(LOCATION_PICKER);

  // While either input is cleared or out of range, the pin stays where it was.
  readonly latitude = model.required<number>();
  readonly longitude = model.required<number>();
  // Names the map for screen readers, e.g. "Statue location".
  readonly label = input('Location');
  readonly hintId = input<string>();
  // True while the form saves: the pin can't be moved, since the save already has its values.
  readonly disabled = input(false);

  protected readonly failed = signal(false);
  private readonly pickerReady = signal(false);
  private picker?: LocationPicker;

  constructor() {
    let destroyed = false;
    inject(DestroyRef).onDestroy(() => {
      destroyed = true;
      this.picker?.destroy();
    });

    afterNextRender(async () => {
      try {
        const createLocationPicker = await this.loadPicker();
        if (destroyed) return;
        const latitude = this.latitude();
        const longitude = this.longitude();
        const start = isPosition(latitude, longitude)
          ? { latitude, longitude }
          : { latitude: 0, longitude: 0 };
        this.picker = createLocationPicker(this.container().nativeElement, start, (position) => {
          if (this.disabled()) return;
          this.latitude.set(position.latitude);
          this.longitude.set(position.longitude);
        });
        this.pickerReady.set(true);
      } catch {
        this.failed.set(true);
      }
    });

    effect(() => {
      const latitude = this.latitude();
      const longitude = this.longitude();
      if (this.picker && isPosition(latitude, longitude)) {
        this.picker.place({ latitude, longitude });
      }
    });

    effect(() => {
      if (this.pickerReady()) this.picker?.setEnabled(!this.disabled());
    });
  }
}
