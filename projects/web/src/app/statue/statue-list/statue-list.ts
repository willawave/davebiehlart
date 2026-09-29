import { Component, computed, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ImageGrid, toImageGridItem } from '../../shared/image-grid/image-grid';
import { MapPoint, MultiPointMap } from '../../shared/multi-point-map/multi-point-map';
import { setPageMeta } from '../../shared/page-meta';
import { RouterLinks } from '../../shared/router-links.enum';
import { Site } from '../../shared/site.enum';
import { StatueListSkeleton } from '../statue-list-skeleton/statue-list-skeleton';
import { StatueStore } from '../statue.store';

// A map of every statue above the grid. The grid carries the same links as the map's pins,
// for visitors who can't use the map.
@Component({
  imports: [ImageGrid, MultiPointMap, StatueListSkeleton],
  selector: 'app-statue-list',
  styleUrl: './statue-list.scss',
  templateUrl: './statue-list.html',
})
export class StatueList {
  protected readonly store = inject(StatueStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly items = computed(() =>
    this.store.visibleStatueItems().map((item) => toImageGridItem(item, item.dedicated)),
  );
  protected readonly points = computed<MapPoint[]>(() =>
    this.store.visibleStatueItems().map(({ id, name, location }) => ({
      id: id ?? '',
      name,
      latitude: location.latitude,
      longitude: location.longitude,
    })),
  );

  constructor() {
    void this.store.loadVisible();
    setPageMeta(inject(Meta), {
      title: `Statues | ${Site.TITLE}`,
      description: 'Public bronze statues by artist Dave Biehl, and where to find them.',
      path: `/${RouterLinks.STATUES}`,
    });
  }

  protected open(id: string): void {
    void this.router.navigate([id], { relativeTo: this.route });
  }
}
