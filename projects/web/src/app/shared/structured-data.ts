import { Site } from './site.enum';

// schema.org JSON-LD for search engines. Each id owns one <script> in <head>: `ld-page` for the
// page's own data, `ld-breadcrumb` for its trail.
export type StructuredDataId = 'ld-page' | 'ld-breadcrumb';
export type StructuredData = Record<string, unknown>;

// Writes, replaces, or (with null) removes the script for `id`. `<` is escaped so text from
// Firestore can't close the script early.
export function setStructuredData(
  document: Document,
  id: StructuredDataId,
  data: StructuredData | null,
): void {
  const existing = document.getElementById(id);
  if (!data) {
    existing?.remove();
    return;
  }
  const script = existing ?? document.createElement('script');
  script.id = id;
  script.setAttribute('type', 'application/ld+json');
  script.textContent = JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(
    /</g,
    '\\u003c',
  );
  if (!existing) {
    document.head.appendChild(script);
  }
}

export const ARTIST: StructuredData = {
  '@type': 'Person',
  name: 'Dave Biehl',
  jobTitle: 'Sculptor',
  url: Site.CANONICAL,
};

export function websiteData(): StructuredData {
  return {
    '@graph': [
      { '@type': 'WebSite', name: Site.TITLE, url: Site.CANONICAL },
      { ...ARTIST, description: 'Bronze sculptor from Nebraska.' },
    ],
  };
}

export interface ArtworkData {
  name: string;
  description: string;
  path: string;
  images: string[];
  medium: 'Bronze' | 'Glass';
  artform: string;
  place?: PlaceData;
}

export interface PlaceData {
  venue: string;
  street: string;
  city: string;
  region: string;
}

function place({ venue, street, city, region }: PlaceData): StructuredData {
  return {
    '@type': 'Place',
    name: venue,
    address: {
      '@type': 'PostalAddress',
      streetAddress: street,
      addressLocality: city,
      addressRegion: region,
      addressCountry: 'US',
    },
  };
}

export function artworkData(artwork: ArtworkData): StructuredData {
  return {
    '@type': 'VisualArtwork',
    name: artwork.name,
    description: artwork.description || undefined,
    url: `${Site.CANONICAL}${artwork.path}`,
    image: artwork.images.length ? artwork.images : undefined,
    artMedium: artwork.medium,
    artform: artwork.artform,
    creator: ARTIST,
    contentLocation: artwork.place ? place(artwork.place) : undefined,
  };
}

export interface EventData {
  name: string;
  description: string;
  path: string;
  // ISO date (yyyy-mm-dd), read in UTC like the event pages show it.
  startDate: string;
  place: PlaceData;
}

export function eventData(event: EventData): StructuredData {
  return {
    '@type': 'Event',
    name: event.name,
    description: event.description || undefined,
    url: `${Site.CANONICAL}${event.path}`,
    startDate: event.startDate,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: place(event.place),
    performer: ARTIST,
    organizer: ARTIST,
  };
}

export function breadcrumbData(items: { label: string; url: string }[]): StructuredData {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: `${Site.CANONICAL}${item.url}`,
    })),
  };
}
