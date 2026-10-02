import { expect, test } from '@playwright/test';

// The Content-Security-Policy is production-only (the dev server injects its own inline
// scripts), so it's covered by security-headers.spec.ts and the trial deploy. These run in
// every environment.
test('pages and files send the security headers and hide the server', async ({ request }) => {
  for (const path of ['/', '/bronzes/seed-bronze-01', '/robots.txt', '/no-such-page']) {
    const headers = (await request.get(path)).headers();
    expect(headers['strict-transport-security'], path).toBe('max-age=31536000; includeSubDomains');
    expect(headers['x-content-type-options'], path).toBe('nosniff');
    expect(headers['referrer-policy'], path).toBe('strict-origin-when-cross-origin');
    expect(headers['x-frame-options'], path).toBe('DENY');
    expect(headers['cross-origin-opener-policy'], path).toBe('same-origin');
    expect(headers['permissions-policy'], path).toContain('camera=()');
    expect(headers['x-powered-by'], path).toBeUndefined();
  }
});

test('pages and the sitemap are compressed for browsers that ask', async ({ request }) => {
  for (const path of ['/', '/bronzes/seed-bronze-01', '/sitemap.xml']) {
    const compressed = await request.get(path, { headers: { 'Accept-Encoding': 'br, gzip' } });
    expect(compressed.headers()['content-encoding'], path).toMatch(/^(br|gzip)$/);
    expect(compressed.headers()['vary'], path).toContain('Accept-Encoding');
    const plain = await request.get(path, { headers: { 'Accept-Encoding': 'identity' } });
    expect(plain.headers()['content-encoding'], path).toBeUndefined();
  }
});

test("each page's inline scripts carry a fresh nonce", async ({ request }) => {
  const nonces = async () => {
    const html = await (await request.get('/')).text();
    expect(html).not.toContain('CSP_NONCE');
    return [...html.matchAll(/<script[^>]* nonce="([^"]+)"/g)].map((match) => match[1]);
  };
  const first = await nonces();
  expect(first.length).toBeGreaterThan(0);
  expect(new Set(first).size).toBe(1);
  expect((await nonces())[0]).not.toBe(first[0]);
});
