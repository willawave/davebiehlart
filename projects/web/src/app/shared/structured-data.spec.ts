import {
  artworkData,
  breadcrumbData,
  eventData,
  setStructuredData,
  websiteData,
} from './structured-data';

describe('setStructuredData', () => {
  const script = () => document.getElementById('ld-page');
  const parse = () => JSON.parse(script()?.textContent ?? '{}');

  afterEach(() => script()?.remove());

  it('should write one JSON-LD script with the schema.org context', () => {
    setStructuredData(document, 'ld-page', { '@type': 'WebSite', name: 'A' });

    expect(script()?.getAttribute('type')).toBe('application/ld+json');
    expect(script()?.parentElement).toBe(document.head);
    expect(parse()).toEqual({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'A' });
  });

  it('should replace the script in place, and remove it for null', () => {
    setStructuredData(document, 'ld-page', { name: 'A' });
    setStructuredData(document, 'ld-page', { name: 'B' });
    expect(document.querySelectorAll('#ld-page').length).toBe(1);
    expect(parse().name).toBe('B');

    setStructuredData(document, 'ld-page', null);
    expect(script()).toBeNull();
  });

  it('should escape < so stored text cannot close the script', () => {
    setStructuredData(document, 'ld-page', { name: '</script><b>x' });
    expect(script()?.textContent).not.toContain('</script>');
    expect(parse().name).toBe('</script><b>x');
  });
});

describe('schema builders', () => {
  const place = { venue: 'City Park', street: '1 Main St', city: 'Omaha', region: 'Nebraska' };

  it('should describe the site and the artist', () => {
    const graph = websiteData()['@graph'] as Record<string, unknown>[];
    expect(graph.map((node) => node['@type'])).toEqual(['WebSite', 'Person']);
    expect(graph[1]).toMatchObject({ name: 'Dave Biehl', jobTitle: 'Sculptor' });
  });

  it('should describe an artwork with its canonical URL, and leave out empty fields', () => {
    const data = artworkData({
      name: 'Mustang',
      description: '',
      path: '/bronzes/m',
      images: [],
      medium: 'Bronze',
      artform: 'Sculpture',
    });
    expect(data).toMatchObject({
      '@type': 'VisualArtwork',
      url: 'https://davebiehlart.com/bronzes/m',
    });
    const json = JSON.parse(JSON.stringify(data));
    expect(json).not.toHaveProperty('description');
    expect(json).not.toHaveProperty('image');
    expect(json).not.toHaveProperty('contentLocation');
  });

  it('should describe an in-person event with its address', () => {
    expect(
      eventData({
        name: 'Open Studio',
        description: 'Come by.',
        path: '/events/open',
        startDate: '2026-10-10',
        place,
      }),
    ).toMatchObject({
      '@type': 'Event',
      startDate: '2026-10-10',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: 'City Park',
        address: { streetAddress: '1 Main St', addressLocality: 'Omaha', addressCountry: 'US' },
      },
    });
  });

  it('should number the breadcrumb trail with canonical URLs', () => {
    expect(
      breadcrumbData([
        { label: 'Home', url: '/' },
        { label: 'Bronzes', url: '/bronzes' },
      ])['itemListElement'],
    ).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://davebiehlart.com/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Bronzes',
        item: 'https://davebiehlart.com/bronzes',
      },
    ]);
  });
});
