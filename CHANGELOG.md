# Changelog

All notable changes to this project are documented here.

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
