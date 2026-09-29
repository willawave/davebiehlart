import {
  Component,
  DestroyRef,
  ElementRef,
  InjectionToken,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { MapPoint, MultiPointMapHandle, createMultiPointMap } from '../map/multi-point';

export type { MapPoint } from '../map/multi-point';

// Loads OpenLayers in the browser only, after the page renders. Specs provide a stand-in,
// since jsdom can't draw a map.
export const MULTI_POINT_MAP = new InjectionToken<() => Promise<typeof createMultiPointMap>>(
  'MULTI_POINT_MAP',
  {
    providedIn: 'root',
    factory: () => () => import('../map/multi-point').then((m) => m.createMultiPointMap),
  },
);

// Pins for many places; clicking one reports its id through `pointSelected`. Server
// rendering sends only the empty, sized box. Pins can't be reached by keyboard, so the page
// must offer the same links another way (e.g. a list), and `label` should say where.
@Component({
  selector: 'app-multi-point-map',
  styleUrl: './multi-point-map.scss',
  templateUrl: './multi-point-map.html',
})
export class MultiPointMap {
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('map');
  private readonly load = inject(MULTI_POINT_MAP);

  readonly points = input.required<readonly MapPoint[]>();
  readonly label = input.required<string>();
  readonly pointSelected = output<string>();

  protected readonly failed = signal(false);
  private handle?: MultiPointMapHandle;

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
        this.handle = create(this.container().nativeElement, this.points(), (id) =>
          this.pointSelected.emit(id),
        );
      } catch {
        this.failed.set(true);
      }
    });

    effect(() => {
      const points = this.points();
      this.handle?.setPoints(points);
    });
  }
}
