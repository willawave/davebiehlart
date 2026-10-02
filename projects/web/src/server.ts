import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import { isDevMode } from '@angular/core';
import compression from 'compression';
import express from 'express';
import { join } from 'node:path';
import { cachedSitemap, isCanonicalHost, requestHost, robotsTxt } from './crawl';
import { environment } from './environments/environment';
import { parseImageRequest } from './image-request';
import { ImageFetchError, resizePhoto } from './image-resize';
import { contentSecurityPolicy, newNonce, SECURITY_HEADERS, withNonce } from './security-headers';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();
app.disable('x-powered-by');

/**
 * Security headers on every response. The Content-Security-Policy is added per page below.
 */
app.use((_req, res, next) => {
  res.set(SECURITY_HEADERS);
  next();
});

/**
 * Brotli or gzip for text (pages, scripts, styles, the sitemap). App Hosting doesn't compress
 * for us, and the main script alone is four times smaller compressed. Photos from /img are
 * already WebP and pass through untouched.
 */
app.use(compression());

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Keep every host but davebiehlart.com (www, the App Hosting URL) out of search results.
 */
app.use((req, res, next) => {
  if (!isCanonicalHost(requestHost(req.headers))) {
    res.setHeader('X-Robots-Tag', 'noindex');
  }
  next();
});

// Never cached by the CDN: the answer depends on the request's host headers, which a client can
// forge, and a shared copy would let one forged request serve "Disallow" to every crawler.
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').set('Cache-Control', 'no-store');
  res.send(robotsTxt(requestHost(req.headers)));
});

app.get('/sitemap.xml', async (_req, res) => {
  try {
    const xml = await cachedSitemap(environment.firebase);
    res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(xml);
  } catch (error) {
    console.error('sitemap.xml failed', error);
    res.status(503).set('Retry-After', '3600').send('Sitemap temporarily unavailable');
  }
});

// A Storage photo at a smaller width (image-resize.ts). Each URL is a fixed photo and width,
// and Storage URLs change when a photo is replaced, so the CDN may keep it for a year.
app.get('/img', async (req, res) => {
  const request = parseImageRequest(req.query, environment.firebase);
  if ('error' in request) {
    res.status(400).set('Cache-Control', 'no-store').type('text/plain').send(request.error);
    return;
  }
  try {
    const image = await resizePhoto(request.source, request.width);
    res.type('image/webp').set('Cache-Control', 'public, max-age=31536000, immutable').send(image);
  } catch (error) {
    const status = error instanceof ImageFetchError ? error.status : 502;
    // The path only: the query holds the photo's access token.
    console.error(`/img failed for ${request.source.pathname}:`, (error as Error).message);
    res
      .status(status)
      .set('Cache-Control', 'no-store')
      .type('text/plain')
      .send('Photo unavailable');
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application. Each page gets a fresh
 * nonce: it replaces index.html's placeholder and is the only way an inline script runs.
 * Development skips the policy, since the dev server injects inline scripts of its own.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then(async (response) => {
      if (!response) {
        return next();
      }
      if (!response.headers.get('content-type')?.startsWith('text/html')) {
        return writeResponseToNodeResponse(response, res);
      }
      const nonce = newNonce();
      const headers = new Headers(response.headers);
      headers.delete('content-length');
      if (!isDevMode()) {
        headers.set('Content-Security-Policy', contentSecurityPolicy(nonce));
      }
      const html = withNonce(await response.text(), nonce);
      return writeResponseToNodeResponse(
        new Response(html, { status: response.status, statusText: response.statusText, headers }),
        res,
      );
    })
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
