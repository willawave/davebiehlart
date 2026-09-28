# Dave Biehl Art brand kit

The mare-and-foal mark, the wordmark, and everything generated from them. `web` and `admin` both
serve `dist/icons/` at their site root (see the `assets` entries in `angular.json`).

## Files

| Path                                      | What it is                                                                    |
| ----------------------------------------- | ----------------------------------------------------------------------------- |
| `source/mark.svg`                         | The master mark (700×595, `currentColor`). Every output is rendered from it.  |
| `generate.mjs`                            | `pnpm brand` renders everything below. Commit the output.                     |
| `dist/icons/favicon.ico`                  | 16/32/48px, cropped to the mare's head (viewBox `250 0 450 595`).             |
| `dist/icons/icon.svg`                     | Head crop; bronze, or light bronze in a dark browser theme.                   |
| `dist/icons/mark.svg`                     | Full mark in `currentColor`. The apps use it as the lockup's CSS mask.        |
| `dist/icons/apple-touch-icon.png`         | 180px, mark on parchment.                                                     |
| `dist/icons/icon-{192,512}.png`           | Web-app manifest icons.                                                       |
| `dist/icons/icon-maskable-512.png`        | Manifest icon with the mark inside the maskable safe zone.                    |
| `dist/og-image.png`                       | 1200×630 social preview; also copied to `projects/web/public/`.               |
| `dist/lockup/lockup-*-{light,dark}.png`   | Horizontal and stacked lockups at 2×, transparent, for light or dark grounds. |
| `dist/lockup/mark-{bronze,ink,white}.svg` | Single-color marks for print, embroidery, social avatars.                     |

## Palette

Tokens live in `projects/core/src/styles/_foundry.scss`. Contrast is against the page color.

| Token          | Light     | Dark      | Use                          | Contrast (light / dark) |
| -------------- | --------- | --------- | ---------------------------- | ----------------------- |
| `--dba-page`   | `#f5efe4` | `#15120f` | Page background (parchment)  |                         |
| `--dba-ink`    | `#1f1a14` | `#ece3d3` | Text, wordmark               | 15:1 / 14:1             |
| `--dba-muted`  | `#5c5147` | `#a89a88` | Secondary text               | 7:1 / 7:1               |
| `--dba-bronze` | `#7a4a1e` | `#d9a066` | Mark, links, primary actions | 7.3:1 / 8.6:1           |
| `--dba-rule`   | `#cdbfa8` | `#3a322a` | Hairlines and borders        | decorative              |

`web` follows the visitor's light/dark choice. `admin` is light only.

## Type

- **Cormorant Garamond 600**: the wordmark and headings. Letter-spacing 0.02em.
- **Inter 400/500/600**: everything else.

Both are self-hosted from `@fontsource` (latin subset), so no visitor request goes to Google.

## Using the lockup

- Horizontal is the default: the mark is 1.5× the wordmark's font size, with a 0.35em gap. In the
  apps that's `.dba-lockup` > `.dba-mark` + `.dba-wordmark`; set `font-size` on `.dba-lockup`.
- Stacked is for square or centered formats (posters, social avatars with a name).
- Clear space: at least a quarter of the mark's height on every side.
- Minimum size: a 24px-tall mark on screen. Below that, use the head crop (`icon.svg`).
- Keep the mark bronze, ink or white. Don't recolor it outside the palette, outline it, stretch
  it, or set the wordmark in another typeface.

## Regenerating

Edit `source/mark.svg`, the palette, or the templates in `generate.mjs`, then run `pnpm brand`
and commit `brand/dist/` and `projects/web/public/og-image.png`. The generator uses the
Playwright Chromium from the E2E setup (`pnpm exec playwright install chromium` if missing).
