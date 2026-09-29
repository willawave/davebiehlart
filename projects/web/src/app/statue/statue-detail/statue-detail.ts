import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ImageTrack } from '../../shared/image-track/image-track';
import { SinglePointMap } from '../../shared/single-point-map/single-point-map';
import { StatueStore } from '../statue.store';

// statueDetailResolver has already loaded the statue, or sent the visitor to not found.
// Laid out like a catalogue entry: heading, date line, description, the photo strip, where
// the statue stands, then links to the neighboring statues in list order.
@Component({
  imports: [DatePipe, ImageTrack, RouterLink, SinglePointMap],
  selector: 'app-statue-detail',
  styleUrl: './statue-detail.scss',
  templateUrl: './statue-detail.html',
})
export class StatueDetail {
  protected readonly store = inject(StatueStore);
}
