import { DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { MediaDocument, MediaLink, parseMediaLink, youTubeThumbnailUrl } from 'core';
import { setPageMeta } from '../../shared/page-meta';
import { RouterLinks } from '../../shared/router-links.enum';
import { Site } from '../../shared/site.enum';
import { MediaListSkeleton } from '../media-list-skeleton/media-list-skeleton';
import { MediaStore } from '../media.store';

interface MediaRow {
  item: MediaDocument;
  link: MediaLink;
}

// Videos and press articles in one ledger, newest first: a still (or, for an article, the
// publication's name) beside the title. Each row opens the item's page.
@Component({
  imports: [DatePipe, MediaListSkeleton, NgOptimizedImage, RouterLink],
  selector: 'app-media-list',
  styleUrl: './media-list.scss',
  templateUrl: './media-list.html',
})
export class MediaList {
  protected readonly store = inject(MediaStore);
  protected readonly thumbnail = youTubeThumbnailUrl;
  protected readonly contactLink = `/${RouterLinks.CONTACT}`;
  // Rows a phone shows before scrolling; one of their stills is the page's LCP element.
  protected readonly aboveFold = 6;

  // The service only returns items whose link parses; the filter narrows the type.
  protected readonly rows = computed(() =>
    this.store
      .visibleMediaItems()
      .map((item) => ({ item, link: parseMediaLink(item.link) }))
      .filter((row): row is MediaRow => row.link !== null),
  );

  // "magazine.example.com" → ["magazine.", "example.", "com"], so a narrow tile wraps the
  // name after a dot instead of mid-word.
  protected siteParts(site: string): string[] {
    return site.split(/(?<=\.)/);
  }

  constructor() {
    void this.store.loadVisible();
    setPageMeta(inject(Meta), {
      title: `Media | ${Site.TITLE}`,
      description: 'Videos and press coverage of sculptor Dave Biehl and his bronze work.',
      path: `/${RouterLinks.MEDIA}`,
    });
  }
}
