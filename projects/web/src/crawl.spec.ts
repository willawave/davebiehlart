import { isCanonicalHost, requestHost, robotsTxt, sitemapXml } from './crawl';

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
