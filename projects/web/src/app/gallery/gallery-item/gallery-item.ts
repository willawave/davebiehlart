import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { GalleryDocument } from 'core';
import { ImageTrack } from '../../shared/image-track/image-track';

// The detail page body, laid out like a catalogue entry: heading, date line, description,
// the photo strip, then dimensions.
@Component({
  imports: [DatePipe, ImageTrack],
  selector: 'app-gallery-item',
  styleUrl: './gallery-item.scss',
  templateUrl: './gallery-item.html',
})
export class GalleryItem {
  readonly item = input.required<GalleryDocument>();
  // The section name shown on the date line, e.g. "Bronze".
  readonly kind = input.required<string>();
}
