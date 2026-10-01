import {
  contentSecurityPolicy,
  CSP_NONCE_PLACEHOLDER,
  newNonce,
  SECURITY_HEADERS,
  withNonce,
} from './security-headers';

describe('contentSecurityPolicy', () => {
  const directives = (policy: string) =>
    Object.fromEntries(
      policy.split('; ').map((directive) => {
        const [name, ...values] = directive.split(' ');
        return [name, values];
      }),
    );

  it("should let scripts run only from this site or with the page's nonce", () => {
    expect(directives(contentSecurityPolicy('abc'))['script-src']).toEqual([
      "'self'",
      "'nonce-abc'",
    ]);
  });

  it('should allow only the outside services the pages use', () => {
    const policy = directives(contentSecurityPolicy('abc'));
    expect(policy['img-src']).toEqual([
      "'self'",
      'data:',
      'https://firebasestorage.googleapis.com',
      'https://tile.openstreetmap.org',
      'https://i.ytimg.com',
    ]);
    expect(policy['connect-src']).toContain('https://firestore.googleapis.com');
    expect(policy['frame-src']).toEqual(['https://www.youtube-nocookie.com']);
  });

  it('should block plugins, framing, and base or form hijacking', () => {
    const policy = directives(contentSecurityPolicy('abc'));
    expect(policy['object-src']).toEqual(["'none'"]);
    expect(policy['frame-ancestors']).toEqual(["'none'"]);
    expect(policy['base-uri']).toEqual(["'self'"]);
    expect(policy['form-action']).toEqual(["'self'"]);
  });
});

describe('SECURITY_HEADERS', () => {
  it('should require HTTPS, block sniffing and framing, and limit referrers and features', () => {
    expect(SECURITY_HEADERS).toEqual({
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    });
  });
});

describe('nonces', () => {
  it('should be fresh 128-bit values each time', () => {
    const nonces = new Set(Array.from({ length: 20 }, newNonce));
    expect(nonces.size).toBe(20);
    expect(atob([...nonces][0])).toHaveLength(16);
  });

  it('should replace every placeholder in the page, and leave a page without one alone', () => {
    const html = `<script nonce="${CSP_NONCE_PLACEHOLDER}"></script><app-root ngCspNonce="${CSP_NONCE_PLACEHOLDER}">`;
    expect(withNonce(html, 'n0nce')).toBe(
      '<script nonce="n0nce"></script><app-root ngCspNonce="n0nce">',
    );
    expect(withNonce('<p>plain</p>', 'n0nce')).toBe('<p>plain</p>');
  });
});
