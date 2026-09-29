import { MediaLinkProblem, checkMediaLink, parseMediaLink } from 'core';

// Signal Forms validators shared by the admin forms. Each returns null when the value is fine.

export function positive(message: string) {
  return ({ value }: { value: () => number | null }) => {
    const current = value();
    return current === null || current > 0 ? null : { kind: 'positive', message };
  };
}

// Values are saved trimmed, so spaces alone count as missing.
export function notBlank(message: string) {
  return ({ value }: { value: () => string }) =>
    value().trim() ? null : { kind: 'required', message };
}

// An optional web address: blank, or a full http(s) URL, since the website links to it.
export function httpUrl(message: string) {
  return ({ value }: { value: () => string }) => {
    const current = value().trim();
    if (!current) return null;
    try {
      const { protocol } = new URL(current);
      return protocol === 'http:' || protocol === 'https:' ? null : { kind: 'url', message };
    } catch {
      return { kind: 'url', message };
    }
  };
}

const MEDIA_LINK_MESSAGES: Record<MediaLinkProblem, string> = {
  blank: 'Enter the link.',
  'not-a-url': 'Enter one full web address, starting with https://.',
  'not-http': 'Enter a web address starting with https://.',
  credentials: 'Remove the name and password from the link.',
  'no-host': 'Enter a public web address, like https://news-site.com/story.',
  'youtube-not-a-video':
    "That YouTube link isn't a single video. Open the video and copy its address from Share.",
};

// A media link: a YouTube video or a web article (core's checkMediaLink says which it isn't).
export function mediaLink() {
  return ({ value }: { value: () => string }) => {
    const problem = checkMediaLink(value());
    return problem ? { kind: 'mediaLink', message: MEDIA_LINK_MESSAGES[problem] } : null;
  };
}

// A media link that another item already has, compared as saved (YouTube links canonical).
export function uniqueMediaLink(otherLinks: () => readonly string[], message: string) {
  return ({ value }: { value: () => string }) => {
    const url = parseMediaLink(value())?.url;
    if (!url) return null;
    const taken = otherLinks().some((other) => parseMediaLink(other)?.url === url);
    return taken ? { kind: 'duplicate', message } : null;
  };
}

// A number from min to max inclusive. A cleared input (null) is left to required().
export function between(min: number, max: number, message: string) {
  return ({ value }: { value: () => number | null }) => {
    const current = value();
    return current === null || (current >= min && current <= max)
      ? null
      : { kind: 'range', message };
  };
}
