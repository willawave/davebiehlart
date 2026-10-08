# Changelog

All notable changes to this project are documented here.

## [1.0.0.4] - 2026-10-08

### Added

- Tests for what `sitemap.xml` answers when the server can't read Firestore: 503 with `Retry-After`, so search engines come back later instead of dropping pages. A failed read is never remembered, and an out-of-date sitemap is never served in its place. The sitemap itself behaves as before.

### Changed

- `TODOS.md` moves the sitemap test to Completed.

## [1.0.0.3] - 2026-10-02

### Changed

- `TODOS.md` now says what the performance baselines really cover. The earlier entry claimed a production baseline only, and that one was taken before compression went live. Both an optimized emulator build and production were measured again at v1.0.0.2, three passes each.

## [1.0.0.2] - 2026-10-02

### Fixed

- The public site now compresses its pages, scripts, styles and sitemap (Brotli or gzip, whichever the browser asks for). Hosting wasn't doing it, so every visitor downloaded the main script at its full 512 KB; it is now about 152 KB. Pages on a slow phone connection become usable sooner. Photos are untouched: they are already WebP.

## [1.0.0.1] - 2026-10-02

### Changed

- `CLAUDE.md` now describes how the site really deploys: merging to `main` doesn't deploy, the Deploy workflow is run by hand on `main` and only after a yes, and both sites should answer afterwards. It used to say nothing deploys.
- `TODOS.md` records the finished launch follow-ups (admin upload test, Search Console, a clean content-security-policy crawl of all 110 pages, the legacy repo archived, a production performance baseline) and adds one new item the baseline found: the public site sends its scripts and pages uncompressed.

## [1.0.0.0] - 2026-10-02

**Launch.** davebiehlart.com, www.davebiehlart.com and admin.davebiehlart.com now serve from this repo. The domains moved on 2026-10-01, the production security rules and indexes went live with them, and the post-launch checks passed, including an admin photo upload, reorder and delete.

### Added

- Both sites answer `/apple-touch-icon-precomposed.png` with the home-screen icon. Older iPhones and some crawlers ask for that name no matter what the page links, and it returned "not found" on launch day.

### Changed

- `TODOS.md` records the cutover as done and lists what's left from the launch: archiving the legacy repo, Search Console, a production benchmark, the deploy configuration, and a content-security-policy crawl. Retiring the legacy backends now includes removing the sign-in domains only the legacy admin used.

## [0.12.0.2] - 2026-10-01

### Changed

- The production security rules now go live during the cutover, not before it. A pre-flight check of the legacy site found that under the new rules its home page would fail to load (it lists upcoming events without filtering out hidden ones) and its admin sign-in would fail (it looks admins up by email). `docs/DEPLOY.md` moves the rules deploy into the cutover, after the domains move, and adds steps to confirm each admin's account ID and stop the legacy site from deploying. `TODOS.md` follows the new order and marks the real-data check done.

## [0.12.0.1] - 2026-10-01

### Fixed

- The "slow page shows progress" end-to-end test failed on `main` after v0.12.0.0: it held Firestore at `localhost:8080`, but the app reaches the emulator at `127.0.0.1:8080`, so nothing was held and the test only passed when the page happened to load slowly. Faster reads (the lite SDK) made it fail most of the time. It now holds the right address (30 of 30 runs pass, from 6 of 30).

### Changed

- `TODOS.md` lists the launch loose ends: a production CSP check after cutover, a content question for Dave, and an "After launch" list (photo warm-up, the rest of the security audit, a sitemap test, narrower deploy permissions, and legacy-site cleanup). Backups are marked done.

## [0.12.0.0] - 2026-10-01

### Added

- Search engines get what they need: every page names its official address on davebiehlart.com, and bronzes, glass, statues, events, the home page and breadcrumbs carry structured data, so search results can show them richly. There's now a `robots.txt`, a `sitemap.xml` listing every visible page, and an `llms.txt` summarizing the site for AI assistants.
- Copies of the site at other addresses (the hosting provider's URL, www) ask search engines not to index them, so only davebiehlart.com shows up in results.
- Photos come resized: the site serves each photo at the size it's shown, so scrolling Bronzes on a phone downloads about 2 MB instead of about 17 MB. Detail pages show the artwork much larger.
- Security headers on both the public site and the admin: HTTPS-only, a content security policy that lets only the site's own scripts run, and protection against being framed by other sites.
- Every page of the public site and the admin is checked for accessibility (WCAG 2.2 AA) in light and dark mode, on desktop and phone, by the automated tests.

### Changed

- Search descriptions for an artwork lead with what it is and who made it, e.g. "Captain Jack, a bronze by Dave Biehl: …".
- The public site reads its content with one quick request per page, instead of a long-lived connection.

### Fixed

- On iPhones, opening a bronze, statue or other page could hang for 30 seconds or more, or never finish, after the phone had been locked or another app used. Pages now open promptly; if a read ever stalls, the page loads from the server instead.
- A page that couldn't load its data no longer shows "Page not found" for an artwork that exists.
- On iPhones, tall photos no longer spill out of their frames on the Statues and gallery lists.
- The favicons and the mare-and-foal mark were missing on the hosted site; they load again.
- On a phone, tapping the menu while the page was still loading could open and immediately close it.
- Locations no longer show a stray space before the comma ("Grand Island , Nebraska").
- `robots.txt` can no longer be tricked into telling search engines to skip the site.

## [0.11.2.0] - 2026-09-30

### Added

- A repeatable production deploy. One command ships the public site, the admin app, the Firestore and Storage security rules, and the Firestore indexes together, so the rules and indexes can't fall behind the code that needs them. A Deploy workflow, started by hand in GitHub Actions, runs it on `main` only after CI has passed on that commit, and signs in to Google Cloud without storing a key.
- The public site is set up for Firebase App Hosting, with one server instance kept warm so visitors and search crawlers don't wait for a cold start. The admin app is set up for its own Firebase Hosting site.
- Production's Firestore indexes are now tracked in the repo. Deploys never delete an index that's missing from the file.
- `docs/DEPLOY.md` covers one-time setup, backups, a trial deploy of just the apps (no rules, no DNS), the first full deploy, routine deploys, post-deploy checks, rollback, and moving the domains over from the legacy site.
- `TODOS.md` lists everything left before launch.

### Fixed

- The public site now renders pages on the server for davebiehlart.com and its App Hosting address. Before, those hosts weren't on the allowed list, so production would have sent search engines an empty page shell.

### Changed

- `pnpm start` and `pnpm emulators` start only the Auth, Firestore and Storage emulators, so they never serve a production build of the admin app locally.

## [0.11.1.0] - 2026-09-29

### Added

- After you click a link, a thin bronze bar runs along the bottom of the header until the next page appears, so a slow connection no longer looks like an unresponsive site. It stays hidden on fast page changes, and screen readers hear that the page is busy.
- The header stays at the top of the screen as you scroll. On wider screens it shrinks to one slim row with the logo, links and theme toggle once you scroll down, and grows back at the top of the page. Between 760 and 1024 pixels wide, the slim row shows just the horse mark.
- Once the first page has loaded, the site fetches the other sections' pages in the background, so later clicks wait only for their content. If one of those fetches fails, the rest still go ahead.

### Changed

- Keyboard focus and links to a spot on a page now stop below the pinned header instead of hiding behind it.

## [0.11.0.0] - 2026-09-29

### Added

- A new home page tells Dave's story without relying on artwork photos. It opens on a dark, bronze-lit band with the headline "Shaped by the Nebraska plains." over a large, faint horse mark, with buttons to see the bronzes or commission a piece.
- "From clay to bronze" walks through five chapters: growing up on the ranch near Lexington, his 1976 veterinary degree from Kansas State, Sculpture in the Park in Loveland in 2003, teaching himself from a bag of used clay, and his commission work today.
- "Where to see it" lists the places his work is on permanent display, from Henry Doorly Zoo to downtown Hastings, and links to the Statues page.
- An "Explore" list links to Bronzes, Statues, Kiln Glass, Events and Media, and a closing band invites visitors to talk with Dave about a commission.
- Dark bands alternate with parchment sections down the page, in both light and dark mode. Sections rise into place as you scroll, and all motion stays off for visitors who ask their device for reduced motion.
- The home page has its own search description and share tags.

## [0.10.0.0] - 2026-09-29

### Added

- The Contact page lists Dave's email and phone number as links that open your mail app or dialer, above the gallery hours.
- The Privacy Policy is written in plain language and matches what the site actually does: no accounts, no analytics and no tracking cookies. The only thing kept on your device is your light or dark theme choice. It names the outside services pages load from (Google Firebase, OpenStreetMap map tiles, and YouTube's privacy-enhanced player), each linked to its own privacy policy.
- The Terms of Use cover copyright on Dave's artwork, photos and text (no reuse or AI training without his written permission), say that nothing is sold on the site, note that hours and events can change, and set Nebraska law.
- The Not Found page says the page may have moved, links home and lists every section of the site. It still answers with a real 404.
- Contact, Privacy Policy and Terms of Use each have their own search description and share tags.

### Changed

- No page is prerendered anymore. Privacy Policy and Terms of Use are rendered on the server for every visit like the rest, so the footer's copyright year stays current without a redeploy.

## [0.9.0.0] - 2026-09-29

### Added

- The Contact page has a "Visit the gallery" section with the gallery's address and weekly hours. Days that keep the same hours share a row, such as Mon – Thu 10 AM – 6 PM, and today's row is marked. Above the heading, a line says whether the gallery is open today and when, worked out in Nebraska time wherever the page is rendered. An optional special message, such as a holiday closure, shows above the hours.
- The Contact page is rendered on the server for every visit, so a change to the hours shows right away.
- Admins can set the hours for each day of the week on a new Schedule page, reached from the dashboard. A day can be marked Closed, which locks its times. The form refuses a missing time on an open day and a closing time that isn't after the opening time. The hours are stored in the same document the current site reads, so both stay in sync.
- The local emulators come with sample hours: Monday to Thursday 10 to 6, Friday and Saturday 10 to 7, closed Sunday.

### Changed

- The gallery's venue is now called Main Street Studios, which is also the default venue for new events and statues.
- Dave's email address is corrected to dave.hvs50@gmail.com.

## [0.8.0.0] - 2026-09-29

### Added

- The public site has a Media page listing YouTube videos and press articles together, newest first. A video shows its YouTube thumbnail, and an article shows the publication's name, such as startribune.com.
- Each item has its own page. A video plays there, embedded without YouTube cookies. An article's page gives its summary and a "Read on {site}" button that opens the article in a new tab.
- Media pages are rendered on the server with their own title, description and, for a video, its thumbnail as the share image. Hidden items, and old ones whose link can't be shown, show the Not Found page with a 404.
- Admins can add, edit and delete media. The form refuses a link that isn't a full web address, isn't http or https, carries a name and password, points at a local address, is a YouTube channel or playlist rather than one video, or is already listed. It shows a preview of what the site will display, with a link to check it. YouTube links in any form (youtu.be, Shorts, embed, mobile) are saved as the standard watch address, the form older items already use.
- The admin table has a Type column that marks each item Video or Article, and flags an old link the site can't show as "Invalid link".
- The local emulators come with 12 sample media items, 7 videos and 5 articles, plus one hidden.

### Fixed

- A media date keeps the day that was picked, whatever the admin's time zone.

## [0.7.0.0] - 2026-09-29

### Added

- The public site has an Events page listing upcoming events, soonest first, each with its date, time, venue and town. An event stays listed through its whole day. When nothing is coming up, which is most of the time, the page says so and points to the contact page.
- Each event has its own page with its date and time, description, an optional link to more details, its address and a map of where it takes place. A past event's page still opens, with a note that it has ended and a link back to upcoming events.
- Event pages are rendered on the server with their own title and description. Hidden events show the Not Found page with a 404.
- Admins can add, edit and delete events. The location is set on a map the same way as a statue's. The table marks each event Upcoming or Past, and an event's date is saved as the start of that day, so a new event left on today's date still lists as upcoming.
- The local emulators come with 12 past sample events plus one hidden, so the public Events page shows its empty state, as it usually will in production.

## [0.6.0.0] - 2026-09-29

### Added

- The public site has a Statues page: a map of every visible statue above a grid of them, newest dedication first. Nearby statues group into a numbered marker that zooms in when clicked, and clicking a single marker opens that statue. The map only zooms with Ctrl or ⌘ held, so scrolling the page never gets stuck on it.
- Each statue has its own page with its photos, its dedication date, its address and a map of where it stands. Previous and Next links step through the statues in list order.
- Statue pages are rendered on the server with their own title, description and share image. Hidden statues show the Not Found page with a 404.
- Admins can add, edit and delete statues. The statue's location is set by clicking the map, dragging its pin, or typing the latitude and longitude, and the map follows typed coordinates. A new statue starts at the studio's address. The map is locked while a save runs, so a late pin move can't be lost.
- Statue photos upload, reorder and delete the same way as gallery photos, in each statue's own storage folder. A photo that a statue reuses from elsewhere is never deleted with it.
- The local emulators come with 12 sample statues around Nebraska and Iowa, plus one hidden, with photos in mixed shapes.

### Fixed

- A piece's photo strip now starts at its cover after Previous or Next, instead of where the last piece's strip was scrolled to (bronzes and glass too).

## [0.5.0.0] - 2026-09-28

### Added

- The public site has Bronzes and Kiln Glass pages. Each shows a grid of visible pieces, newest first, with the whole photo in a mat so nothing is cropped.
- Each piece has its own page with its photos in a scrolling strip, its date and dimensions, and a full-size photo viewer with arrow-key navigation. Previous and Next links step through the section in list order, on one row even on phones.
- Pages are rendered on the server with their own title, description and share image, so search engines and link previews see each piece. Hidden pieces, and pieces opened under the wrong section, show the Not Found page with a 404.
- Admins can add, edit and delete gallery pieces. The form checks required fields, and photos upload as soon as they're picked. The first photo is the cover, and photos can be reordered or removed.
- Each piece keeps its photos in its own storage folder. Photos that are removed, or that were uploaded to a piece that was never saved, are deleted.
- Photos over 1 MB are shrunk before they're stored, converting to JPEG when needed. JPEG, PNG, WebP, GIF and AVIF files up to 20 MB are accepted.
- The local emulators come with sample bronzes and glass pieces in mixed portrait and landscape sizes, for testing.

### Changed

- The storage rules now reject uploads of 1 MB or more (this takes effect in production only when the rules are deployed).
- The production Firebase web config is now in each app's `environment.ts`. The README explains why it isn't a secret.
- The first photos on the gallery pages load right away at high priority, so the page's largest photo appears sooner.
- The admin form locks while a save is running, so no edit made mid-save is lost.

## [0.4.0.1] - 2026-09-28

### Fixed

- Pressing "Skip to content" before the page finishes loading no longer logs an error in the browser console. It still takes you to the content, as before. A new test presses it before the page loads and checks for errors.

## [0.4.0.0] - 2026-09-28

### Added

- Dave Biehl Art now has a brand kit. The site header and the admin bar show the bronze mare-and-foal mark next to the name.
- Browser tabs, bookmarks, and phone home screens show the mark as the site icon. In dark browser tabs it switches to a lighter bronze.
- Both sites can be installed as an app, with their own names and icons.
- Links to the site shared on social media and in chat apps show a preview card with the mark, the name, and "Bronze sculptures, statues, & kiln glass".
- The mark, lockups, and share image live in `brand/`. `pnpm brand` regenerates them from the master mark, so a change to the mark or colors updates every size at once.

### Changed

- The admin site now uses the same bronze-on-parchment look as the public site, in light mode only.
- Fonts and icons load from the site itself instead of Google Fonts, so pages make no requests to Google.
- The site description now reads "Bronze sculptures, statues, and kiln glass".

### Fixed

- A shared link to any page now previews that page. Before, every page told social sites it was the homepage.
- The browser console no longer warns about how the page loads during development (NG05001). A new test confirms the browser still reuses the page the server sent.

## [0.3.0.0] - 2026-09-28

### Added

- The public site can now be browsed. A header links Home, Bronzes, Statues, Kiln Glass, Events, Media and Contact, and marks the section you're in. On a phone, the links move into a menu that slides in from the right and closes on Escape, on the close button, or when you pick a page, including the page you're already on.
- Every section and detail page has its own URL and browser tab title (for example "Bronzes | Dave Biehl Art"), and unknown addresses show a Not Found page with a real 404 status.
- A breadcrumb (Home › Bronzes › item) shows where you are and links back up.
- Light and dark mode. The site follows your system setting, including when it changes, until you pick a scheme with the toggle; your choice is remembered and applied before the page first paints.
- A footer with the section links, the copyright, Privacy Policy, Terms of Use, and a "Site by Willawave" credit that opens in a new tab.
- Keyboard and screen reader support: a "Skip to content" link that keeps you on the current page, focus that moves to the new page after you navigate, and accessibility checks (axe) in light and dark mode, including the open phone menu.
- The site's look: bronze on parchment in light mode, with Cormorant Garamond headings and Inter text.

### Changed

- Pages load without flicker: the browser reuses the page the server sent instead of rebuilding it.
- The site's title and search description now read "Dave Biehl Art".

## [0.2.1.1] - 2026-09-24

### Changed

- Local `/retro` snapshots in `.context/` are no longer picked up by git, so running a retro leaves the working tree clean.

## [0.2.1.0] - 2026-09-24

### Changed

- The follow-up backlog is down to what blocks launch: one "before going live" checklist for hosting the admin app (production Firebase config, the authorized sign-in domain, a popup-safe cross-origin header, deploy setup). Six hardening items that don't fit a two-admin site were dropped.
- A new project rule keeps the backlog lean: log a follow-up only if it breaks real use, risks production data, or blocks launch.
- The admin app's production build warns above 1 MB and fails above 1.5 MB, up from 500 kB and 1 MB, so its current 830 kB build no longer warns.

## [0.2.0.0] - 2026-09-24

### Added

- Admins can sign in to the admin app with Google. Only accounts that have a document in the Firestore `users` collection get in. Anyone else sees an Access Denied page and is signed straight back out. Google's account chooser always appears, so "Sign in with another account" lets you pick a different account.
- Admin pages (dashboard, events, gallery, media, statues) require a signed-in admin. A signed-out visit goes to sign-in, and a signed-in admin who opens the sign-in page goes straight to the dashboard.
- A toolbar showing the signed-in admin's email and a Sign out button. If the session ends while an admin page is open, for example after signing out in another tab, the app returns to sign-in. If a different account signs in from another tab, admin pages wait for that account's admin check before showing anything.
- Clear messages when sign-in fails or admin access can't be verified, with a retry by signing in again.
- `pnpm start`, `pnpm emulators` and `pnpm e2e` now load a committed seed of fake test accounts (`admin@test.com`, an admin, and `outsider@test.com`, not an admin), and `pnpm emulators:export` updates it. CI fails if the seed ever holds an email outside `@test.com`.
- End-to-end tests for the sign-in flows, each with an accessibility check, running under the local Auth and Firestore emulators.

### Changed

- The admin app has its own look: a dark-green toolbar reading "Dave Biehl Art", IBM Plex Sans, 16px body text, a Google sign-in button with its icon centered, and a clear focus ring for keyboard users.
- The admin app asks search engines not to index it.

### Fixed

- An unknown admin URL now goes to sign-in (or the dashboard for a signed-in admin) instead of showing a blank page.
- `pnpm test <project> --coverage` runs again. The coverage plugin had been a major version ahead of the test runner.

## [0.1.0.3] - 2026-09-24

### Added

- A Version check in CI: every PR must raise `VERSION` above `main`'s and add a matching CHANGELOG entry. In the merge queue it also fails a PR whose version was already claimed by a PR queued ahead of it, so parallel branches can't both land the same version.

## [0.1.0.2] - 2026-09-24

### Changed

- CI now also runs for GitHub's merge queue, so PRs can be queued with "Merge when ready" and each one is tested on top of the latest `main` (plus anything queued ahead of it) before it merges. The formatting check covers every file changed by the PRs in the queued batch.

## [0.1.0.1] - 2026-09-24

### Changed

- Local gstack run reports under `.gstack/` (deploy and QA reports) are now git-ignored, so they never show up as untracked files or get committed to the public repo.

## [0.1.0.0] - 2026-09-24

### Added

- `pnpm start` runs the web app (http://localhost:4200), the admin app (http://localhost:4201), and local Firebase emulators (UI at http://localhost:4010) together for manual testing. Emulator data starts empty and is discarded on exit.
- Both apps now connect to Firebase through shared core providers. Development builds are locked to the local emulators under a `demo-` project and refuse to start if pointed at a real project; production config goes in each app's `environment.ts`.
- Firestore and Storage security rules in the repo, with an emulator-backed test suite (`pnpm test:rules`): public read of site content, admin-only writes (admin = a `users/{uid}` document), no self-promotion to admin.
- Playwright smoke tests for both apps (`pnpm e2e`), ESLint (`pnpm lint`), and a GitHub Actions workflow that runs formatting, lint, unit, build, rules, and E2E checks on every pull request.
- Shared agent instructions in AGENTS.md: production-data guardrails, architecture, commands, and workflow, so Claude Code, Codex, and other agents follow the same rules.

### Changed

- Security rules are stricter than what is live in production: users are readable only by their own UID, hidden drafts can't be listed publicly, Storage listing is admin-only, and uploads must be raster images under 20 MB. They take effect only when deliberately deployed (see AGENTS.md for the pre-deploy checklist).
- Shared models and constants are imported from `core` instead of relative paths, and admin store state uses camelCase keys.
- The web app prerenders only its static pages (contact, privacy policy, terms of use) and renders everything else per request.
- The not-found page returns HTTP 404 when server-rendered (takes effect once the navigation shell renders routes).

### Fixed

- The web app build, which failed on routes with parameters.
- A web store exported under the wrong name, empty unit test files that failed the suite, and existing lint errors.
