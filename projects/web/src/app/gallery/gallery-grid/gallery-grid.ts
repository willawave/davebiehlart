import { DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GalleryDocument } from 'core';

// The list pages' grid. Each photo sits whole on a square mat (object-fit: contain), so tall
// and wide pieces show uncropped side by side. Links are relative to the list route.
@Component({
  imports: [DatePipe, NgOptimizedImage, RouterLink],
  selector: 'app-gallery-grid',
  styleUrl: './gallery-grid.scss',
  templateUrl: './gallery-grid.html',
})
export class GalleryGrid {
  readonly items = input.required<GalleryDocument[]>();
  readonly loading = input(false);
  readonly error = input<string | null>(null);
}
