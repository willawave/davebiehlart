import { Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { GalleryStyle } from 'core';
import { RouterLinks } from '../../shared/router-links.enum';
import { setPageMeta } from '../../shared/page-meta';
import { Site } from '../../shared/site.enum';
import { GalleryGrid } from '../gallery-grid/gallery-grid';
import { GalleryStore } from '../gallery.store';

@Component({
  imports: [GalleryGrid],
  selector: 'app-glass-list',
  styleUrl: './glass-list.scss',
  templateUrl: './glass-list.html',
})
export class GlassList {
  protected readonly store = inject(GalleryStore);

  constructor() {
    void this.store.loadVisible(GalleryStyle.GLASS);
    setPageMeta(inject(Meta), {
      title: `Kiln Glass | ${Site.TITLE}`,
      description: 'Kiln glass by artist Dave Biehl.',
      path: `/${RouterLinks.GLASS}`,
    });
  }
}
