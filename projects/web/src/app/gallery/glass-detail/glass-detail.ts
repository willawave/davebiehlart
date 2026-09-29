import { Component, inject } from '@angular/core';
import { GalleryItem } from '../gallery-item/gallery-item';
import { GalleryStore } from '../gallery.store';

// galleryDetailResolver has already loaded the item, or sent the visitor to not found.
@Component({
  imports: [GalleryItem],
  selector: 'app-glass-detail',
  styleUrl: './glass-detail.scss',
  templateUrl: './glass-detail.html',
})
export class GlassDetail {
  protected readonly store = inject(GalleryStore);
}
