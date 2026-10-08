import { EMULATOR_FIREBASE_ENVIRONMENT } from 'core';
import {
  cachedSitemap,
  isCanonicalHost,
  requestHost,
  robotsTxt,
  sitemapReply,
  sitemapXml,
} from './crawl';

describe('requestHost', () => {
  it("should prefer the visitor's host from X-Forwarded-Host, lowercased", () => {
    expect(
      requestHost({ 'x-forwarded-host': 'DaveBiehlArt.com, proxy', host: 'internal:8080' }),
    ).toBe('davebiehlart.com');
    expect(requestHost({ 'x-forwarded-host': ['davebiehlart.com'] })).toBe('davebiehlart.com');
  });

  it('should fall back to Host', () => {
    expect(requestHost({ host: 'localhost:4200' })).toBe('localhost:4200');
    expect(requestHost({})).toBe('');
  });
});

describe('isCanonicalHost', () => {
  it('should accept only davebiehlart.com', () => {
    expect(isCanonicalHost('davebiehlart.com')).toBe(true);
    expect(isCanonicalHost('www.davebiehlart.com')).toBe(false);
    expect(isCanonicalHost('web--the-bronze-horse-b3aa2.us-central1.hosted.app')).toBe(false);
    expect(isCanonicalHost('localhost:4200')).toBe(false);
  });
});

describe('robotsTxt', () => {
  it('should allow crawling and point to the sitemap on the canonical host', () => {
    expect(robotsTxt('davebiehlart.com')).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://davebiehlart.com/sitemap.xml\n',
    );
  });

  it('should keep crawlers off every other host', () => {
    expect(robotsTxt('web--x.us-central1.hosted.app')).toBe('User-agent: *\nDisallow: /\n');
  });
});

describe('sitemapXml', () => {
  const locs = (xml: string) => Array.from(xml.matchAll(/<loc>([^<]*)<\/loc>/g), (m) => m[1]);

  it('should list the static pages, then each detail page once, as canonical URLs', () => {
    const urls = locs(sitemapXml(['/bronzes/a', '/statues/b', '/bronzes/a']));

    expect(urls).toContain('https://davebiehlart.com/');
    expect(urls).toContain('https://davebiehlart.com/bronzes');
    expect(urls).toContain('https://davebiehlart.com/privacy-policy');
    expect(urls).toContain('https://davebiehlart.com/terms-of-use');
    expect(urls.filter((url) => url === 'https://davebiehlart.com/bronzes/a')).toHaveLength(1);
    expect(urls).toContain('https://davebiehlart.com/statues/b');
  });

  it('should be a well-formed sitemap with XML special characters escaped', () => {
    const xml = sitemapXml(["/media/a&b'c"]);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('https://davebiehlart.com/media/a&amp;b&apos;c');
  });
});

describe('sitemapReply', () => {
  it('should answer 200 as XML, cacheable for an hour, with the sitemap as the body', async () => {
    const reply = await sitemapReply(() => Promise.resolve('<urlset/>'));

    expect(reply).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
      body: '<urlset/>',
    });
  });

  it('should answer 503 with Retry-After and no sitemap when the build fails', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('Firestore unreachable');

    const reply = await sitemapReply(() => Promise.reject(failure));

    expect(reply).toEqual({
      status: 503,
      headers: { 'Retry-After': '3600' },
      body: 'Sitemap temporarily unavailable',
    });
    expect(logged).toHaveBeenCalledWith('sitemap.xml failed', failure);
    logged.mockRestore();
  });
});

// The cache is module state. Each test starts a day after the one before it, so whatever an
// earlier test cached has expired and every test sets up its own cache.
describe('cachedSitemap', () => {
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;
  const env = EMULATOR_FIREBASE_ENVIRONMENT;
  const unreachable = () => Promise.reject(new Error('Firestore unreachable'));
  const pages = (path: string) => vi.fn(() => Promise.resolve([path]));

  it("should reject when Firestore can't be read", async () => {
    await expect(cachedSitemap(env, DAY, unreachable)).rejects.toThrow('Firestore unreachable');
  });

  it('should not cache a failure: the next call loads again', async () => {
    const start = 2 * DAY;
    await expect(cachedSitemap(env, start, unreachable)).rejects.toThrow();
    const load = pages('/bronzes/a');

    const xml = await cachedSitemap(env, start, load);

    expect(load).toHaveBeenCalledWith(env);
    expect(xml).toContain('https://davebiehlart.com/bronzes/a');
  });

  it('should reuse the sitemap for an hour without loading again', async () => {
    const start = 3 * DAY;
    await cachedSitemap(env, start, pages('/bronzes/first'));
    const load = pages('/bronzes/second');

    const xml = await cachedSitemap(env, start + HOUR - 1, load);

    expect(load).not.toHaveBeenCalled();
    expect(xml).toContain('https://davebiehlart.com/bronzes/first');
  });

  it('should reject, not serve the expired copy, when a reload fails after the hour', async () => {
    const start = 4 * DAY;
    await cachedSitemap(env, start, pages('/bronzes/first'));

    await expect(cachedSitemap(env, start + HOUR, unreachable)).rejects.toThrow(
      'Firestore unreachable',
    );
  });
});
