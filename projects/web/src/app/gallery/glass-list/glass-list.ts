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
  selector: 'app-glass-list',
  styleUrl: './glass-list.scss',
  templateUrl: './glass-list.html',
})
export class GlassList {
  protected readonly store = inject(GalleryStore);
  protected readonly items = computed(() =>
    this.store.visibleGalleryItems().map((item) => toImageGridItem(item, item.created)),
  );

  constructor() {
    void this.store.loadVisible(GalleryStyle.GLASS);
    setPageMeta(inject(Meta), {
      title: `Kiln Glass | ${Site.TITLE}`,
      description: 'Kiln glass by artist Dave Biehl.',
      path: `/${RouterLinks.GLASS}`,
    });
  }
}
