import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { setPageMeta, toMetaDescription } from './page-meta';

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

  beforeEach(() => {
    meta = TestBed.inject(Meta);
    meta.addTags([
      { property: 'og:image', content: 'https://davebiehlart.com/og-image.png' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
    ]);
  });

  afterEach(() => {
    for (const selector of [
      "name='description'",
      "property='og:title'",
      "property='og:description'",
      "property='og:url'",
      "property='og:image'",
      "property='og:image:alt'",
      "property='og:image:width'",
      "property='og:image:height'",
    ]) {
      meta.removeTag(selector);
    }
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
