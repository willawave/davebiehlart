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
  selector: 'app-bronze-list',
  styleUrl: './bronze-list.scss',
  templateUrl: './bronze-list.html',
})
export class BronzeList {
  protected readonly store = inject(GalleryStore);

  constructor() {
    void this.store.loadVisible(GalleryStyle.BRONZE);
    setPageMeta(inject(Meta), {
      title: `Bronzes | ${Site.TITLE}`,
      description: 'Bronze sculptures by artist Dave Biehl.',
      path: `/${RouterLinks.BRONZES}`,
    });
  }
}
