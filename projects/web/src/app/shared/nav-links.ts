import { RouterLinks } from './router-links.enum';

export interface NavLink {
  label: string;
  path: string;
}

// The site's main sections, in the order the header, drawer, and footer list them.
export const NAV_LINKS: readonly NavLink[] = [
  { label: 'Home', path: '/' },
  { label: 'Bronzes', path: `/${RouterLinks.BRONZES}` },
  { label: 'Statues', path: `/${RouterLinks.STATUES}` },
  { label: 'Kiln Glass', path: `/${RouterLinks.GLASS}` },
  { label: 'Events', path: `/${RouterLinks.EVENTS}` },
  { label: 'Media', path: `/${RouterLinks.MEDIA}` },
  { label: 'Contact', path: `/${RouterLinks.CONTACT}` },
];
