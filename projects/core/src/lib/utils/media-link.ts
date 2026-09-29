// A media item's `link` is either a YouTube video or a web article. Production stores only the
// URL, so the kind is always read from it, here, by both the admin form and the website.

export type MediaLink =
  // `url` is the canonical watch URL, the form production has always stored.
  | { kind: 'video'; videoId: string; url: string }
  // `site` is the host without "www.", e.g. "startribune.com".
  | { kind: 'article'; url: string; site: string };

export type MediaLinkProblem =
  'blank' | 'not-a-url' | 'not-http' | 'credentials' | 'no-host' | 'youtube-not-a-video';

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);
const SHORT_HOST = 'youtu.be';
// Paths that carry the ID as their second segment, e.g. /shorts/ID.
const ID_PATHS = new Set(['shorts', 'embed', 'live', 'v']);
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function youTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function youTubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

// The video ID in a YouTube link, or null. Undefined when the host isn't YouTube at all.
function youTubeVideoId(url: URL): string | null | undefined {
  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split('/').filter(Boolean);
  let id: string | null | undefined;
  if (host === SHORT_HOST) {
    id = segments[0];
  } else if (YOUTUBE_HOSTS.has(host)) {
    id =
      segments[0] === 'watch'
        ? url.searchParams.get('v')
        : ID_PATHS.has(segments[0] ?? '')
          ? segments[1]
          : null;
  } else {
    return undefined;
  }
  return id && VIDEO_ID.test(id) ? id : null;
}

function parse(raw: string): { link: MediaLink | null; problem: MediaLinkProblem | null } {
  const trimmed = raw.trim();
  if (!trimmed) return { link: null, problem: 'blank' };
  // Two pasted links, or a link with a sentence after it, still parse as one URL.
  if (/\s/.test(trimmed)) return { link: null, problem: 'not-a-url' };
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { link: null, problem: 'not-a-url' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { link: null, problem: 'not-http' };
  }
  if (url.username || url.password) return { link: null, problem: 'credentials' };
  const host = url.hostname.toLowerCase();
  // A public site: a dotted name, not localhost or a bare IPv4/IPv6 address.
  if (!host.includes('.') || host.startsWith('[') || /^[\d.]+$/.test(host)) {
    return { link: null, problem: 'no-host' };
  }
  const videoId = youTubeVideoId(url);
  if (videoId === null) return { link: null, problem: 'youtube-not-a-video' };
  if (videoId) {
    return { link: { kind: 'video', videoId, url: youTubeWatchUrl(videoId) }, problem: null };
  }
  return {
    link: { kind: 'article', url: trimmed, site: host.replace(/^www\./, '') },
    problem: null,
  };
}

// The link as the site shows it, or null if it isn't one the site can show.
export function parseMediaLink(raw: string): MediaLink | null {
  return parse(raw).link;
}

// Why a link can't be saved, or null if it can.
export function checkMediaLink(raw: string): MediaLinkProblem | null {
  return parse(raw).problem;
}
