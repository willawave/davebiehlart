import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GalleryDocument } from 'core';
import { ImageTrack } from '../../shared/image-track/image-track';

// The detail page body, laid out like a catalogue entry: heading, date line, description,
// the photo strip, dimensions, then links to the neighboring pieces in list order.
@Component({
  imports: [DatePipe, ImageTrack, RouterLink],
  selector: 'app-gallery-item',
  styleUrl: './gallery-item.scss',
  templateUrl: './gallery-item.html',
})
export class GalleryItem {
  readonly item = input.required<GalleryDocument>();
  // The section name shown on the date line, e.g. "Bronze".
  readonly kind = input.required<string>();
  // The section in plural, for the pager's name, e.g. "bronzes" → "More bronzes".
  readonly sectionLabel = input('pieces');
  // The newer and older neighbors in the section's list; null at either end.
  readonly previous = input<GalleryDocument | null>(null);
  readonly next = input<GalleryDocument | null>(null);
}
