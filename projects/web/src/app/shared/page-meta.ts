import { Meta } from '@angular/platform-browser';
import { Site } from './site.enum';
import { setStructuredData, StructuredData } from './structured-data';

export interface PageMeta {
  title: string;
  description: string;
  // Site-relative, e.g. `/bronzes/abc`. Any query or fragment is dropped.
  path: string;
  // Replaces index.html's default share image.
  image?: { url: string; alt: string };
  // The page's schema.org data, if any (see structured-data.ts).
  structuredData?: StructuredData;
}

// The same page is served on davebiehlart.com, www and the App Hosting URL; the canonical link
// tells search engines which one to index.
export function setCanonical(document: Document, url: string | null): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!url) {
    link?.remove();
    return;
  }
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
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

// A detail page's description, led by what the work is and who made it (e.g. "Captain Jack, a
// bronze by Dave Biehl: …") unless the text already names the artist. A short note like "one of
// 5 in a family" says little in a search result on its own.
export function describeWork(intro: string, description: string): string {
  const text = description.replace(/\s+/g, ' ').trim();
  if (!text) {
    return toMetaDescription(`${intro}.`);
  }
  return toMetaDescription(/\bbiehl\b/i.test(text) ? text : `${intro}: ${text}`);
}

// Sets the description, canonical link, Open Graph tags and structured data. The <title>
// itself comes from the route's `title`. Crawlers render each URL fresh on the server, so
// tags left over from a previous client-side navigation never reach them.
export function setPageMeta(meta: Meta, page: PageMeta): void {
  const url = `${Site.CANONICAL}${page.path.split(/[?#]/)[0]}`;
  // The document comes from the tag just written: callers include resolvers, which can't
  // inject after awaiting their data.
  const document = meta.updateTag({
    name: 'description',
    content: page.description,
  })!.ownerDocument;
  setCanonical(document, url);
  setStructuredData(document, 'ld-page', page.structuredData ?? null);
  meta.updateTag({ property: 'og:title', content: page.title });
  meta.updateTag({ property: 'og:description', content: page.description });
  meta.updateTag({ property: 'og:url', content: url });
  if (page.image) {
    meta.updateTag({ property: 'og:image', content: page.image.url });
    meta.updateTag({ property: 'og:image:alt', content: page.image.alt });
    // The default image's size; an artwork photo's size is unknown.
    meta.removeTag("property='og:image:width'");
    meta.removeTag("property='og:image:height'");
  }
}
