import { Meta } from '@angular/platform-browser';
import { Site } from './site.enum';

export interface PageMeta {
  title: string;
  description: string;
  // Site-relative, e.g. `/bronzes/abc`.
  path: string;
  // Replaces index.html's default share image.
  image?: { url: string; alt: string };
}

const MAX_DESCRIPTION = 160;

// Search results cut descriptions off near 160 characters; end on a whole word.
export function toMetaDescription(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= MAX_DESCRIPTION) {
    return flat;
  }
  const cut = flat.slice(0, MAX_DESCRIPTION - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s.,;:]+$/, '')}…`;
}

// Sets the description and Open Graph tags that index.html gives every page. The <title>
// itself comes from the route's `title`. Crawlers render each URL fresh on the server, so
// tags left over from a previous client-side navigation never reach them.
export function setPageMeta(meta: Meta, page: PageMeta): void {
  meta.updateTag({ name: 'description', content: page.description });
  meta.updateTag({ property: 'og:title', content: page.title });
  meta.updateTag({ property: 'og:description', content: page.description });
  meta.updateTag({ property: 'og:url', content: `${Site.CANONICAL}${page.path}` });
  if (page.image) {
    meta.updateTag({ property: 'og:image', content: page.image.url });
    meta.updateTag({ property: 'og:image:alt', content: page.image.alt });
    // The default image's size; an artwork photo's size is unknown.
    meta.removeTag("property='og:image:width'");
    meta.removeTag("property='og:image:height'");
  }
}
