import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { describeWork, setCanonical, setPageMeta, toMetaDescription } from './page-meta';

describe('describeWork', () => {
  const intro = 'Captain Jack, a bronze by Dave Biehl';

  it('should lead a bare note with what the work is and who made it', () => {
    expect(describeWork(intro, ' one of 5 in a\njack rabbit family ')).toBe(
      'Captain Jack, a bronze by Dave Biehl: one of 5 in a jack rabbit family',
    );
  });

  it('should keep a description that already names the artist', () => {
    expect(describeWork(intro, 'Dave Biehl cast this hare in 2019.')).toBe(
      'Dave Biehl cast this hare in 2019.',
    );
  });

  it('should use the intro alone when there is no description', () => {
    expect(describeWork(intro, '  ')).toBe('Captain Jack, a bronze by Dave Biehl.');
  });

  it('should still fit a search result', () => {
    expect(describeWork(intro, 'word '.repeat(60)).length).toBeLessThanOrEqual(160);
  });
});

describe('toMetaDescription', () => {
  it('should flatten whitespace and keep short text whole', () => {
    expect(toMetaDescription('  A bronze\n\nhorse.  ')).toBe('A bronze horse.');
  });

  it('should cut long text on a word boundary, under 160 characters', () => {
    const text = `${'word '.repeat(60)}end.`;
    const description = toMetaDescription(text);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(description).toMatch(/word…$/);
  });
});

describe('setPageMeta', () => {
  let meta: Meta;
  const content = (selector: string) => meta.getTag(selector)?.content;
  const selectors = [
    "name='description'",
    "property='og:title'",
    "property='og:description'",
    "property='og:url'",
    "property='og:image'",
    "property='og:image:alt'",
    "property='og:image:width'",
    "property='og:image:height'",
  ];
  // Removes every match, so tags another spec left in the shared <head> can't shadow ours.
  const clearTags = () => {
    for (const selector of selectors) {
      meta.getTags(selector).forEach((tag) => meta.removeTagElement(tag));
    }
  };

  beforeEach(() => {
    meta = TestBed.inject(Meta);
    clearTags();
    meta.addTags([
      { property: 'og:image', content: 'https://davebiehlart.com/og-image.png' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
    ]);
  });

  afterEach(() => {
    clearTags();
    setCanonical(document, null);
    document.getElementById('ld-page')?.remove();
  });

  it('should set the description, title and canonical URL tags', () => {
    setPageMeta(meta, {
      title: 'Bronzes | Dave Biehl Art',
      description: 'Bronzes.',
      path: '/bronzes',
    });

    expect(content("name='description'")).toBe('Bronzes.');
    expect(content("property='og:title'")).toBe('Bronzes | Dave Biehl Art');
    expect(content("property='og:description'")).toBe('Bronzes.');
    expect(content("property='og:url'")).toBe('https://davebiehlart.com/bronzes');
    // No image given: the site default stays.
    expect(content("property='og:image'")).toBe('https://davebiehlart.com/og-image.png');
    expect(content("property='og:image:width'")).toBe('1200');
  });

  it('should keep one canonical link, without query or fragment, and replace it per page', () => {
    const canonical = () =>
      Array.from(document.head.querySelectorAll('link[rel="canonical"]'), (link) =>
        link.getAttribute('href'),
      );

    setPageMeta(meta, { title: 'A', description: 'A.', path: '/bronzes?page=2#top' });
    expect(canonical()).toEqual(['https://davebiehlart.com/bronzes']);
    expect(content("property='og:url'")).toBe('https://davebiehlart.com/bronzes');

    setPageMeta(meta, { title: 'B', description: 'B.', path: '/statues' });
    expect(canonical()).toEqual(['https://davebiehlart.com/statues']);

    setCanonical(document, null);
    expect(canonical()).toEqual([]);
  });

  it("should set the page's structured data, and clear it on a page without any", () => {
    setPageMeta(meta, {
      title: 'Home',
      description: 'Home.',
      path: '/',
      structuredData: { '@type': 'WebSite', name: 'Dave Biehl Art' },
    });
    expect(document.getElementById('ld-page')?.textContent).toContain('"WebSite"');

    setPageMeta(meta, { title: 'Contact', description: 'Contact.', path: '/contact' });
    expect(document.getElementById('ld-page')).toBeNull();
  });

  it("should swap in an artwork image and drop the default image's size", () => {
    setPageMeta(meta, {
      title: 'Mustang',
      description: 'A horse.',
      path: '/bronzes/mustang',
      image: { url: 'https://example.test/m.jpg', alt: 'Mustang' },
    });

    expect(content("property='og:image'")).toBe('https://example.test/m.jpg');
    expect(content("property='og:image:alt'")).toBe('Mustang');
    expect(meta.getTag("property='og:image:width'")).toBeNull();
    expect(meta.getTag("property='og:image:height'")).toBeNull();
  });
});
