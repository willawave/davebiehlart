# Dave Biehl Art — rebuild of the legacy site

Replace the legacy Angular 19 app (`bbiehl/the-bronze-horse-angular`, one app serving the public
site and `/admin` at davebiehlart.com) with this Angular 22 monorepo: `web` at davebiehlart.com,
`admin` at admin.davebiehlart.com, and a shared `core` library. Both run on the same Firebase
project ("The Bronze Horse") and its live production data. Then retire the legacy app. The
site's brand is **Dave Biehl Art**; "The Bronze Horse" is only the Firebase project name.

How to work in this repo — guardrails, architecture rules, commands — is in AGENTS.md and
CLAUDE.md. This file says what we're building, in what order, and when it's done.

## Goals

- A fast, accessible public site that shows Dave's bronzes, glass, public statues, events and
  media, ranks in search, and works on a phone.
- An admin two people can use to manage that content without help.
- Nothing in production changes shape, and nobody can make themselves an admin from a clone of
  this public repo.

## Non-goals

Public accounts, comments, e-commerce, analytics, newsletter, i18n. Two admins, both in
Central Time.

## Legacy app (source of truth for data and security)

- Repo: `bbiehl/the-bronze-horse-angular` (archived after cutover).
- **Port as-is in the first PR:** `firestore.rules`, `storage.rules`, their tests,
  `emulator-mock-data` (fake data, safe to publish), the data models.
- **Reference only:** UI, routes, copy. **Drop:** Angular 19 patterns, the single-app layout.
- **Before the first PR (read-only):** compare the _deployed_ rules and indexes with the
  legacy repo and record every difference here. Production is the truth, not the repo.
- **Schema:** collections `gallery`, `statue`, `event`, `media`, `schedule`, `users` (singular
  names, as in production; the Storage photo folders are plural, e.g. `statues/`). Shapes are
  mirrored in `projects/core/src/lib/models/` and never change.

### URL map

Every public legacy URL keeps working or redirects (301) to its new home, so search ranking
carries over.

| Legacy (davebiehlart.com)                              | New                                               |
| ------------------------------------------------------ | ------------------------------------------------- |
| `/`, `/contact`, `/privacy-policy`, `/terms-of-use`    | Same paths on `web`                               |
| `/bronzes`, `/glass`, `/statues`, `/events` (+ `/:id`) | Same paths on `web`                               |
| `/media`                                               | Same path on `web` (adds `/media/:id`)            |
| `/admin/*`                                             | admin.davebiehlart.com (no redirect; admins only) |

## Architecture decisions

- **web:** SSR on Firebase App Hosting, server-rendered per request (no prerender). Reads
  Firestore with `firebase/firestore/lite` (iOS kills the full SDK's long-lived connection),
  and a transfer cache hands server reads to the browser so hydration doesn't refetch. Read-only.
  Photos are served through `/img`, a server resizer (WebP, fixed widths, CDN-cached).
- **admin:** SPA on Firebase Hosting, `noindex`. An admin is any user with a `users/{uid}`
  document — **no roles, no custom claims.** Enforced by Firestore and Storage rules; the route
  guard is only UX. Users are created only by hand in the Firestore console.
- **Data flow:** Component → SignalStore → Service → Firebase SDK.
- **Stack:** Angular 22 (zoneless, signals, Signal Forms), Angular Material 22, `@ngrx/signals`,
  Vitest, Playwright, Firebase Auth / Firestore / Storage, Node 24, pnpm.

## Definition of done

Every content feature ships with all of:

- Admin: list, add, edit, delete, show/hide, photo upload (resized in the browser), reorder
  where order matters.
- Web: server-rendered list and detail pages. Hidden or missing items return a real 404.
  Title, description, Open Graph and structured data on every page. Listed in the sitemap.
- Seed: 12+ visible items plus 1 hidden, with portrait, landscape, tall, panorama and square
  photos, so a page actually fills.
- Tests: unit tests for store and service, Playwright E2E for the user flow, an axe sweep of
  the new routes, rules tests for any rule change.

## Budgets (checked per feature, not saved for a launch audit)

- Accessibility: WCAG 2.2 AA, axe-clean in light and dark, desktop and phone, keyboard reachable.
- Security: CSP with a per-page nonce, HSTS and the standard headers on both apps.
- Performance: first paint < 1 s on a fast connection; no full-size photo in a grid.
- Devices: walked on a real iPhone before each feature merges.

## Phases

1. [x] **Foundation** — CI and merge queue, emulators with the seed, ported rules and their
       tests, Firebase wiring, VERSION check.
2. [x] **Auth** — Google sign-in, UID admin check, guarded routes.
3. [x] **Brand and shell** — brand kit (favicons, OG image, fonts), theme, light/dark mode,
       web app shell, routing, breadcrumbs. Decided once with `/design-consultation`.
4. [x] **Gallery** (the template feature) — Bronzes and Glass. Once it ships, its store,
       service, resolver, seed and tests are the pattern the next features copy.
5. [x] **Statues, Events, Media, Schedule** — built in parallel off the gallery pattern.
       Statues and events get maps; media mixes YouTube videos and articles with link
       safeguards; schedule is gallery hours admins edit, shown on Contact.
6. [x] **Home and static pages** — home, Contact, Privacy Policy, Terms of Use, Not Found.
7. [x] **Launch readiness** — confirm the budgets above on the real-data build, sitemap
       submitted to Search Console, security audit (`/cso`), baselines (`/benchmark`).
8. [x] **Cutover** — see below.
9. [ ] **Retire legacy** — delete its App Hosting backends, prune unused indexes, remove
       legacy-only Auth domains and the extra web app registration (TODOS.md).

## Cutover and rollback

1. Turn on Firestore point-in-time recovery and daily backups; check Storage soft delete.
2. Check every live client against the new rules (AGENTS.md → Production data guardrails).
3. Deploy rules, indexes and both apps from `main` via the Deploy workflow.
4. Move domains with App Hosting's "Migrate domain"; add `admin.davebiehlart.com` as an
   authorized Auth domain.
5. Verify: both URLs return 200, a crawl of every sitemap page passes, an admin uploads,
   reorders and deletes one photo.
6. **Rollback:** the legacy backends stay idle (rollouts off) until phase 9; point the domains
   back and redeploy the previous rules.

## Process

Plan mode → branch `feat-<feature>` → `/design-shotgun` for UI → build (an approved plan is
consent for the files and deps it names; take Claude's recommendations) → `/codex:review`,
one pass with no fix loops or specialist subagents → `/qa` against the emulators (skip for
non-UI changes) → `/ship` (VERSION + CHANGELOG, opens the PR) → `/land-and-deploy`.
Production deploys only after a yes in that session. Fold docs-only edits into the next code PR.

## Open questions and risks

- Production's composite indexes are not all tracked in this repo; a new `visible == true` +
  `orderBy` query needs one created in production.
- Old `/admin` bookmarks on davebiehlart.com now 404; the two admins use admin.davebiehlart.com.
