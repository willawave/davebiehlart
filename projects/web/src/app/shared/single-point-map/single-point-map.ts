import {
  Component,
  DestroyRef,
  ElementRef,
  InjectionToken,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type { SinglePointMapHandle, createSinglePointMap } from '../map/single-point';

// Loads OpenLayers in the browser only, after the page renders. Specs provide a stand-in,
// since jsdom can't draw a map.
export const SINGLE_POINT_MAP = new InjectionToken<() => Promise<typeof createSinglePointMap>>(
  'SINGLE_POINT_MAP',
  {
    providedIn: 'root',
    factory: () => () => import('../map/single-point').then((m) => m.createSinglePointMap),
  },
);

// A map centered on one place, with a pin. Server rendering sends only the empty, sized box.
@Component({
  selector: 'app-single-point-map',
  styleUrl: './single-point-map.scss',
  templateUrl: './single-point-map.html',
})
export class SinglePointMap {
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('map');
  private readonly load = inject(SINGLE_POINT_MAP);

  readonly latitude = input.required<number>();
  readonly longitude = input.required<number>();
  // Names the map for screen readers, e.g. "Map showing where The Pioneer stands".
  readonly label = input.required<string>();

  protected readonly failed = signal(false);
  private handle?: SinglePointMapHandle;

  constructor() {
    let destroyed = false;
    inject(DestroyRef).onDestroy(() => {
      destroyed = true;
      this.handle?.destroy();
    });

    afterNextRender(async () => {
      try {
        const create = await this.load();
        if (destroyed) return;
        this.handle = create(this.container().nativeElement, this.position());
      } catch {
        this.failed.set(true);
      }
    });

    // The detail page stays mounted while previous/next change the statue.
    effect(() => {
      const position = this.position();
      this.handle?.setPosition(position);
    });
  }

  private position() {
    return { latitude: this.latitude(), longitude: this.longitude() };
  }
}
