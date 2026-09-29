import { Component } from '@angular/core';

// Placeholder ledger rows while the media list loads, shaped like the real rows so the page
// doesn't jump. Screen readers hear only "Loading…".
@Component({
  selector: 'app-media-list-skeleton',
  styleUrl: './media-list-skeleton.scss',
  templateUrl: './media-list-skeleton.html',
})
export class MediaListSkeleton {
  protected readonly rows = [1, 2, 3, 4];
}
