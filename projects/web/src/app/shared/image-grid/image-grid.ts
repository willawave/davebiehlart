import { DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Timestamp } from 'firebase/firestore/lite';

// One card: the item's cover, name, and the year from `date` (created, dedicated, ...).
export interface ImageGridItem {
  id: string;
  name: string;
  imageUrl: string | undefined;
  date: Timestamp;
}

export function toImageGridItem(
  item: { id?: string; name: string; imageUrls: string[] },
  date: Timestamp,
): ImageGridItem {
  return { id: item.id ?? '', name: item.name, imageUrl: item.imageUrls[0], date };
}

// The list pages' grid. Each photo sits whole on a square mat (object-fit: contain), so tall
// and wide pieces show uncropped side by side. Links are relative to the list route.
@Component({
  imports: [DatePipe, NgOptimizedImage, RouterLink],
  selector: 'app-image-grid',
  styleUrl: './image-grid.scss',
  templateUrl: './image-grid.html',
})
export class ImageGrid {
  readonly items = input.required<ImageGridItem[]>();
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  // Cards that can be above the fold: two rows at 4 columns on desktop, four at 2 on phones.
  // Any of them can be the page's largest paint (a wide photo fills more of its mat than a
  // tall one), so all load eagerly at high priority, and SSR preloads them.
  protected readonly priorityCount = 8;
}
