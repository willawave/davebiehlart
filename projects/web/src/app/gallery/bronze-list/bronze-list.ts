import { Component, computed, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { GalleryStyle } from 'core';
import { ImageGrid, toImageGridItem } from '../../shared/image-grid/image-grid';
import { RouterLinks } from '../../shared/router-links.enum';
import { setPageMeta } from '../../shared/page-meta';
import { Site } from '../../shared/site.enum';
import { GalleryStore } from '../gallery.store';

@Component({
  imports: [ImageGrid],
  selector: 'app-bronze-list',
  styleUrl: './bronze-list.scss',
  templateUrl: './bronze-list.html',
})
export class BronzeList {
  protected readonly store = inject(GalleryStore);
  protected readonly items = computed(() =>
    this.store.visibleGalleryItems().map((item) => toImageGridItem(item, item.created)),
  );

  constructor() {
    void this.store.loadVisible(GalleryStyle.BRONZE);
    setPageMeta(inject(Meta), {
      title: `Bronzes | ${Site.TITLE}`,
      description: 'Bronze sculptures by artist Dave Biehl.',
      path: `/${RouterLinks.BRONZES}`,
    });
  }
}
