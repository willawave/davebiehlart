import { checkMediaLink, parseMediaLink, youTubeThumbnailUrl } from './media-link';

const ID = 'dQw4w9WgXcQ';
const WATCH = `https://www.youtube.com/watch?v=${ID}`;

describe('parseMediaLink', () => {
  it.each([
    [WATCH],
    [`https://youtube.com/watch?v=${ID}`],
    [`https://m.youtube.com/watch?v=${ID}`],
    [`https://music.youtube.com/watch?v=${ID}`],
    [`http://www.youtube.com/watch?v=${ID}`],
    [`https://www.youtube.com/watch?v=${ID}&t=30s&list=PL123&si=abc`],
    [`https://www.youtube.com/watch?feature=share&v=${ID}`],
    [`https://youtu.be/${ID}`],
    [`https://youtu.be/${ID}?si=abc&t=12`],
    [`https://www.youtube.com/shorts/${ID}`],
    [`https://www.youtube.com/embed/${ID}`],
    [`https://www.youtube.com/live/${ID}?feature=share`],
    [`https://www.youtube-nocookie.com/embed/${ID}`],
    [`  ${WATCH}  `],
    [`https://WWW.YouTube.com/watch?v=${ID}`],
  ])('reads %s as the canonical video', (raw) => {
    expect(parseMediaLink(raw)).toEqual({ kind: 'video', videoId: ID, url: WATCH });
  });

  it('keeps an article URL as typed, trimmed, query string included', () => {
    expect(parseMediaLink(' https://www.startribune.com/story/123?page=2#top ')).toEqual({
      kind: 'article',
      url: 'https://www.startribune.com/story/123?page=2#top',
      site: 'startribune.com',
    });
  });

  it('names a subdomain site in full', () => {
    expect(parseMediaLink('http://news.example.org/a')).toEqual({
      kind: 'article',
      url: 'http://news.example.org/a',
      site: 'news.example.org',
    });
  });

  it('is null for anything that fails the check', () => {
    expect(parseMediaLink('https://www.youtube.com/@davebiehl')).toBeNull();
    expect(parseMediaLink('not a link')).toBeNull();
  });
});

describe('checkMediaLink', () => {
  it.each([
    ['', 'blank'],
    ['   ', 'blank'],
    ['example.com/story', 'not-a-url'],
    ['www.youtube.com/watch?v=dQw4w9WgXcQ', 'not-a-url'],
    ['https://example.com/a https://example.com/b', 'not-a-url'],
    ['https://example.com/a story', 'not-a-url'],
    ['javascript:alert(1)', 'not-http'],
    ['ftp://example.com/file', 'not-http'],
    ['mailto:dave@example.com', 'not-http'],
    ['https://user:pass@example.com/', 'credentials'],
    ['https://user@example.com/', 'credentials'],
    ['http://localhost:4200/media', 'no-host'],
    ['http://192.168.1.10/story', 'no-host'],
    ['http://[::1]/story', 'no-host'],
    ['https://intranet/story', 'no-host'],
    ['https://www.youtube.com/', 'youtube-not-a-video'],
    ['https://www.youtube.com/@davebiehl', 'youtube-not-a-video'],
    ['https://www.youtube.com/channel/UC123', 'youtube-not-a-video'],
    ['https://www.youtube.com/playlist?list=PL123', 'youtube-not-a-video'],
    ['https://www.youtube.com/watch?v=short', 'youtube-not-a-video'],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQx', 'youtube-not-a-video'],
    ['https://youtu.be/', 'youtube-not-a-video'],
    ['https://www.youtube.com/shorts/', 'youtube-not-a-video'],
  ])('rejects %j as %s', (raw, problem) => {
    expect(checkMediaLink(raw)).toBe(problem);
  });

  it('accepts videos and articles', () => {
    expect(checkMediaLink(`https://youtu.be/${ID}`)).toBeNull();
    expect(checkMediaLink('https://example.com/story')).toBeNull();
  });
});

describe('youTubeThumbnailUrl', () => {
  it('points at the video still', () => {
    expect(youTubeThumbnailUrl(ID)).toBe(`https://i.ytimg.com/vi/${ID}/hqdefault.jpg`);
  });
});
