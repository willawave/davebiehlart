// Headers server.ts adds to every response. admin gets the same set from firebase.json.

// index.html carries this where a nonce belongs (ngCspNonce on <app-root>, nonce on its inline
// script). Angular copies ngCspNonce onto the inline scripts and styles it renders, so swapping
// the placeholder in the finished page covers every inline script.
export const CSP_NONCE_PLACEHOLDER = 'CSP_NONCE';

export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
};

// Scripts run only from this site or with the page's nonce. Styles allow inline because
// Angular and Material set style="" attributes. Images and connections reach Firebase,
// OpenStreetMap tiles and YouTube thumbnails; the only frame is the privacy-enhanced YouTube
// player.
export function contentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://firebasestorage.googleapis.com https://tile.openstreetmap.org https://i.ytimg.com",
    "connect-src 'self' https://firestore.googleapis.com https://firebasestorage.googleapis.com",
    'frame-src https://www.youtube-nocookie.com',
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

// 128 random bits, base64. Web Crypto, which Node provides globally.
export function newNonce(): string {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
}

export function withNonce(html: string, nonce: string): string {
  return html.replaceAll(CSP_NONCE_PLACEHOLDER, nonce);
}
