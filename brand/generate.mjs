// Renders the brand kit from brand/source/mark.svg: favicons, OG image and lockups.
// Run with `pnpm brand` after changing the mark, palette or wordmark, and commit the output.
// Rendering goes through the Playwright Chromium the E2E suite already installs, with fonts
// read from @fontsource, so the output does not depend on fonts installed on this machine.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const at = (...p) => resolve(root, ...p);

// The Foundry palette (see projects/core/src/styles/_foundry.scss).
const light = {
  page: '#f5efe4',
  ink: '#1f1a14',
  muted: '#5c5147',
  bronze: '#7a4a1e',
  rule: '#cdbfa8',
};
const dark = {
  page: '#15120f',
  ink: '#ece3d3',
  muted: '#a89a88',
  bronze: '#d9a066',
  rule: '#3a322a',
};

// The full mark, and a crop around the mare's head that stays legible at 16-32px.
const MARK_VIEWBOX = '0 0 700 595';
const HEAD_VIEWBOX = '250 0 450 595';

const markSource = readFileSync(at('brand/source/mark.svg'), 'utf8').trim();
const pathData = [...markSource.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);

/** The mark as a standalone SVG, filled with `fill` (a color or `currentColor`). */
function markSvg({ fill = 'currentColor', viewBox = MARK_VIEWBOX, attrs = '', style = '' } = {}) {
  const paths = pathData.map((d) => `<path fill="${fill}" d="${d}"/>`).join('');
  const css = style ? `<style>${style}</style>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${attrs}>${css}${paths}</svg>`;
}

const fontFile = (pkg, file) =>
  'data:font/woff2;base64,' +
  readFileSync(at('node_modules/@fontsource', pkg, 'files', file)).toString('base64');

const fontFaces = `
  @font-face { font-family: 'Cormorant Garamond'; font-weight: 600;
    src: url(${fontFile('cormorant-garamond', 'cormorant-garamond-latin-600-normal.woff2')}); }
  @font-face { font-family: 'Inter'; font-weight: 500;
    src: url(${fontFile('inter', 'inter-latin-500-normal.woff2')}); }
`;

// The horizontal lockup (mark at 1.5x the wordmark size, 0.35em gap) and the stacked one.
const lockupCss = `
  ${fontFaces}
  * { box-sizing: border-box; }
  html, body { margin: 0; background: transparent; }
  .lockup { display: inline-flex; align-items: center; gap: 0.35em; padding: 0.25em;
    font: 600 var(--size)/1 'Cormorant Garamond'; letter-spacing: 0.02em; white-space: nowrap; }
  .lockup svg { display: block; flex: none; height: 1.5em; width: auto; }
  .stacked { flex-direction: column; gap: 0.2em; }
  .stacked svg { height: 2.25em; }
`;

function lockupHtml(palette, { stacked = false, size = '96px' } = {}) {
  return `<style>${lockupCss}</style>
    <div class="lockup${stacked ? ' stacked' : ''}" style="--size:${size}; color:${palette.ink}">
      ${markSvg({ fill: palette.bronze })}<span>Dave Biehl Art</span>
    </div>`;
}

function iconHtml({ size, background, viewBox = MARK_VIEWBOX, inset = 0 }) {
  const box = size - inset * 2;
  return `<style>html,body{margin:0;background:${background ?? 'transparent'}}
    svg{position:absolute;left:${inset}px;top:${inset}px;width:${box}px;height:${box}px}</style>
    ${markSvg({ fill: light.bronze, viewBox })}`;
}

const ogHtml = `<style>
  ${fontFaces}
  html, body { margin: 0; width: 1200px; height: 630px; background: ${light.page}; }
  body { display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 36px; color: ${light.ink}; }
  .frame { position: absolute; inset: 28px; border: 1px solid ${light.rule}; }
  .lockup { display: flex; align-items: center; gap: 38px;
    font: 600 112px/1 'Cormorant Garamond'; letter-spacing: 0.02em; }
  .lockup svg { height: 184px; width: auto; }
  .rule { width: 96px; height: 2px; background: ${light.bronze}; }
  .tagline { font: 500 22px/1 'Inter'; letter-spacing: 0.18em; text-transform: uppercase;
    color: ${light.muted}; }
</style>
<div class="frame"></div>
<div class="lockup">${markSvg({ fill: light.bronze })}<span>Dave Biehl Art</span></div>
<div class="rule"></div>
<div class="tagline">Bronze sculpture, statues &amp; kiln glass</div>`;

/** Packs PNGs into an .ico: a 6-byte header, one 16-byte entry per image, then the PNGs. */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, entry);
    header.writeUInt8(size >= 256 ? 0 : size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.png)]);
}

const iconsDir = at('brand/dist/icons');
const lockupDir = at('brand/dist/lockup');
mkdirSync(iconsDir, { recursive: true });
mkdirSync(lockupDir, { recursive: true });

const browser = await chromium.launch();

async function render(html, { width, height, scale = 1, transparent = false, selector } = {}) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  const target = selector ? page.locator(selector) : page;
  const png = await target.screenshot({ omitBackground: transparent });
  await page.close();
  return png;
}

const square = (size, options) =>
  render(iconHtml({ size, ...options }), {
    width: size,
    height: size,
    transparent: !options.background,
  });

// Favicons. Small sizes use the head crop; the SVG icon switches to the dark bronze in dark tabs.
const icoImages = [];
for (const size of [16, 32, 48]) {
  icoImages.push({ size, png: await square(size, { viewBox: HEAD_VIEWBOX }) });
}
writeFileSync(`${iconsDir}/favicon.ico`, ico(icoImages));
writeFileSync(
  `${iconsDir}/icon.svg`,
  markSvg({
    viewBox: HEAD_VIEWBOX,
    style: `path{fill:${light.bronze}}@media (prefers-color-scheme:dark){path{fill:${dark.bronze}}}`,
  }) + '\n',
);
// The full mark in currentColor; the apps use it as a CSS mask for the lockup.
writeFileSync(`${iconsDir}/mark.svg`, markSvg() + '\n');
writeFileSync(
  `${iconsDir}/apple-touch-icon.png`,
  await square(180, { background: light.page, inset: 18 }),
);
writeFileSync(`${iconsDir}/icon-192.png`, await square(192, { background: light.page, inset: 16 }));
writeFileSync(`${iconsDir}/icon-512.png`, await square(512, { background: light.page, inset: 40 }));
// Maskable icons get cropped to as little as the central 80% circle, so keep the mark well inside.
writeFileSync(
  `${iconsDir}/icon-maskable-512.png`,
  await square(512, { background: light.page, inset: 108 }),
);

// Lockups at 2x on transparent backgrounds, plus single-color marks for print and social.
for (const [name, palette] of Object.entries({ light, dark })) {
  for (const stacked of [false, true]) {
    const png = await render(lockupHtml(palette, { stacked }), {
      width: 1200,
      height: 600,
      scale: 2,
      transparent: true,
      selector: '.lockup',
    });
    writeFileSync(`${lockupDir}/lockup-${stacked ? 'stacked' : 'horizontal'}-${name}.png`, png);
  }
}
for (const [name, fill] of Object.entries({
  bronze: light.bronze,
  ink: light.ink,
  white: '#ffffff',
})) {
  writeFileSync(`${lockupDir}/mark-${name}.svg`, markSvg({ fill }) + '\n');
}

// Open Graph image, served by web only (admin is noindex).
writeFileSync(at('brand/dist/og-image.png'), await render(ogHtml, { width: 1200, height: 630 }));
copyFileSync(at('brand/dist/og-image.png'), at('projects/web/public/og-image.png'));

await browser.close();
console.log('Brand kit written to brand/dist/ and projects/web/public/og-image.png');
