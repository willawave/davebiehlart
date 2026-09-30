import {
  assertSafeFirebaseEnvironment,
  EMULATOR_HOST,
  FirebaseEnvironment,
  FIRESTORE_EMULATOR_PORT,
  GalleryStyle,
} from 'core';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  collection,
  connectFirestoreEmulator,
  Firestore,
  getDocs,
  getFirestore,
  query,
  where,
} from 'firebase/firestore';
import { NAV_LINKS } from './app/shared/nav-links';
import { RouterLinks } from './app/shared/router-links.enum';
import { Site } from './app/shared/site.enum';

// robots.txt, sitemap.xml and the noindex header, served by server.ts. The same pages answer
// on davebiehlart.com, www and the App Hosting URL; only the canonical host is indexed.

export const CANONICAL_HOST = new URL(Site.CANONICAL).host;

// App Hosting passes the visitor's host in X-Forwarded-Host.
export function requestHost(headers: {
  'x-forwarded-host'?: string | string[];
  host?: string;
}): string {
  const forwarded = headers['x-forwarded-host'];
  const host = (Array.isArray(forwarded) ? forwarded[0] : forwarded) ?? headers.host ?? '';
  return host.split(',')[0].trim().toLowerCase();
}

export function isCanonicalHost(host: string): boolean {
  return host === CANONICAL_HOST;
}

export function robotsTxt(host: string): string {
  return isCanonicalHost(host)
    ? `User-agent: *\nAllow: /\n\nSitemap: ${Site.CANONICAL}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n';
}

const STATIC_PATHS = [
  ...NAV_LINKS.map((link) => link.path),
  `/${RouterLinks.PRIVACY_POLICY}`,
  `/${RouterLinks.TERMS_OF_USE}`,
];

function escapeXml(text: string): string {
  return text.replace(
    /[<>&'"]/g,
    (char) =>
      ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char] ?? char,
  );
}

// `paths` are site-relative, e.g. /bronzes/abc.
export function sitemapXml(paths: string[]): string {
  const urls = [...new Set([...STATIC_PATHS, ...paths])]
    .map((path) => `  <url><loc>${escapeXml(`${Site.CANONICAL}${path}`)}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

const SECTIONS: { collection: string; path: string; style?: GalleryStyle }[] = [
  { collection: 'gallery', path: `/${RouterLinks.BRONZES}`, style: GalleryStyle.BRONZE },
  { collection: 'gallery', path: `/${RouterLinks.GLASS}`, style: GalleryStyle.GLASS },
  { collection: 'statue', path: `/${RouterLinks.STATUES}` },
  { collection: 'event', path: `/${RouterLinks.EVENTS}` },
  { collection: 'media', path: `/${RouterLinks.MEDIA}` },
];

// A separate named app: the rendered pages use the default one, set up through Angular DI.
// Server only, so importing the SDK here doesn't touch any browser bundle.
const APP_NAME = 'crawl';

function firestore(environment: FirebaseEnvironment): Firestore {
  if (getApps().some((app) => app.name === APP_NAME)) {
    return getFirestore(getApp(APP_NAME));
  }
  assertSafeFirebaseEnvironment(environment);
  const db = getFirestore(initializeApp(environment.options, APP_NAME));
  if (environment.useEmulators) {
    connectFirestoreEmulator(db, EMULATOR_HOST, FIRESTORE_EMULATOR_PORT);
  }
  return db;
}

// Every visible detail page. `visible == true` is required by the list rule in
// firestore.rules; hidden documents never reach the sitemap.
export async function detailPaths(environment: FirebaseEnvironment): Promise<string[]> {
  const db = firestore(environment);
  const lists = await Promise.all(
    SECTIONS.map(async (section) => {
      const filters = [where('visible', '==', true)];
      if (section.style) {
        filters.push(where('style', '==', section.style));
      }
      const snapshot = await getDocs(query(collection(db, section.collection), ...filters));
      return snapshot.docs.map((doc) => `${section.path}/${encodeURIComponent(doc.id)}`);
    }),
  );
  return lists.flat();
}

const SITEMAP_TTL_MS = 60 * 60 * 1000;
let cached: { xml: string; expires: number } | undefined;

// Built at most once an hour. A Firestore error propagates, so the caller can answer 503 and
// crawlers retry instead of dropping pages.
export async function cachedSitemap(
  environment: FirebaseEnvironment,
  now = Date.now(),
): Promise<string> {
  if (!cached || cached.expires <= now) {
    cached = { xml: sitemapXml(await detailPaths(environment)), expires: now + SITEMAP_TTL_MS };
  }
  return cached.xml;
}
