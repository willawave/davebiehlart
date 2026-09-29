import { Component, inject } from '@angular/core';
import { GalleryItem } from '../gallery-item/gallery-item';
import { GalleryStore } from '../gallery.store';

// galleryDetailResolver has already loaded the item, or sent the visitor to not found.
@Component({
  imports: [GalleryItem],
  selector: 'app-bronze-detail',
  styleUrl: './bronze-detail.scss',
  templateUrl: './bronze-detail.html',
})
export class BronzeDetail {
  protected readonly store = inject(GalleryStore);
}
