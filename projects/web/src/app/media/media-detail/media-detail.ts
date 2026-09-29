import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MediaLink, parseMediaLink } from 'core';
import { MediaStore } from '../media.store';

// mediaDetailResolver has already loaded the item, or sent the visitor to not found. A video
// plays here; an article is summarized and linked, since other sites can't be embedded.
@Component({
  imports: [DatePipe],
  selector: 'app-media-detail',
  styleUrl: './media-detail.scss',
  templateUrl: './media-detail.html',
})
export class MediaDetail {
  protected readonly store = inject(MediaStore);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly link = computed<MediaLink | null>(() => {
    const item = this.store.selectedMediaItem();
    return item ? parseMediaLink(item.link) : null;
  });

  // Safe to trust: parseMediaLink only yields a video ID of 11 [A-Za-z0-9_-] characters, so
  // nothing from Firestore can change the host or path of this URL.
  protected readonly embedUrl = computed<SafeResourceUrl | null>(() => {
    const link = this.link();
    return link?.kind === 'video'
      ? this.sanitizer.bypassSecurityTrustResourceUrl(
          `https://www.youtube-nocookie.com/embed/${link.videoId}`,
        )
      : null;
  });
}
