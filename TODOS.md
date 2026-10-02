# TODOS

Only items that break real use, risk production data, or block launch belong here (see AGENTS.md → Workflow).

## Launch follow-ups

**Priority:** P1

`web` and `admin` went live from this repo on 2026-10-01 (see Completed → Cutover, and → Launch follow-ups for what was done right after).

- After any deploy that adds an outside service (a script, font, image host or API), crawl davebiehlart.com for Content-Security-Policy violations again. The CSP runs only in production builds, so local E2E can't catch a blocked source.

## After launch

**Priority:** P2

- Optionally warm resized photos after each deploy: the first request for each photo size waits while `/img` fetches and resizes the original; a pass over every photo at the grid and detail widths would spare visitors that wait.
- Finish the `/cso` audit's unassessed areas: dependencies (known vulnerabilities), secrets in git history, `.github/workflows/ci.yml`, and admin's client code. Skipped before launch by choice.
- Cover `sitemap.xml`'s 503 path (Firestore unreachable from the server); it has no test.
- Narrow the `github-deploy` service account's roles (Firebase Admin, App Hosting Admin, Storage Admin, Service Account User) to what the Deploy workflow actually uses, once deploys run cleanly.
- After the legacy site is retired and stable: delete its App Hosting backends (`davebiehlart`, `the-bronze-horse`), prune Firestore indexes nothing queries anymore (docs/DEPLOY.md → Indexes), and remove the extra Firebase web app registration `web` and its browser API key that `apphosting:backends:create` added. At the same time, remove the Firebase Auth authorized domains only the legacy admin signed in from: `davebiehlart.com` and `the-bronze-horse--the-bronze-horse-b3aa2.us-central1.hosted.app` (this repo's admin signs in on `admin.davebiehlart.com`). The backends stay idle, rollouts off, as rollback until then.

## Completed

- **Launch follow-ups** (P1): an admin photo upload passed after the v1.0.0.0 deploy; davebiehlart.com is verified in Google Search Console with the sitemap submitted; a browser crawl of all 109 sitemap pages plus the admin sign-in page found no Content-Security-Policy violations and no failed requests; `bbiehl/the-bronze-horse-angular` is archived, so its `firebase deploy` can't bring back the old rules; CLAUDE.md's "Deploy Configuration" describes the real deploy; and a production `/benchmark` baseline is recorded (first paint under half a second on a fast connection). The "May 2026" event question was dropped: nobody will see that page. Completed 2026-10-02.

- **Cutover** (P1): davebiehlart.com, www and admin.davebiehlart.com serve from this repo. The domains moved with App Hosting's "Migrate domain" flow, `admin.davebiehlart.com` is an authorized Auth domain, and the production rules and indexes were deployed from `main` at v0.12.0.2. Post-deploy checks passed, including an admin photo upload, reorder and delete. Completed 2026-10-01.

- **Real-data check** (P1): `web` on its `hosted.app` URL, walked on an iPhone and swept by script (all 101 sitemap pages return 200 with a server-rendered heading; detail photos have alt text; grid photos are decorative, labeled by the card name), and `admin` on `davebiehlart-admin.web.app`, looked at without saving. Completed 2026-10-01.

- **Backups** (P1): Firestore point-in-time recovery and a daily backup kept 14 days are on (2026-10-01); Storage soft delete keeps deleted files 7 days.
- **Pre-launch audits** (P1): SEO, accessibility, security headers, `/design-review`, `/cso` (partial: dependencies, secrets history, `ci.yml` and admin client code not assessed, by choice) and unit/E2E coverage, each on its own `feat-launch-*` branch. Completed on branch `feat-launch-readiness`.
- **Photo thumbnails** (P1): grids and detail strips downloaded every full upload (200 KB–1 MB each, ~17 MB scrolling Bronzes on a phone). web's server now resizes Storage photos on request (`/img`, sharp, WebP, CDN-cached for a year), limited to this project's bucket and a fixed set of widths. Completed on branch `feat-launch-thumbnails`.
- **iPhone pages hanging** (P1): on iOS, taps sometimes hung forever because iOS kills Firestore's long-lived browser connection and the SDK waits on it. web now reads Firestore with the lite SDK's one-off requests, so there's no long-lived connection to die; as a safety net, a browser read that takes over 6 seconds, or fails, loads the page from the server instead, and a failed detail read no longer shows "Page not found". Completed on branch `feat-launch-mobile-nav`.
- **Security headers** (P1): `web` (server.ts) and `admin` (firebase.json) send HSTS, a Content-Security-Policy, `nosniff`, `Referrer-Policy`, `X-Frame-Options`, COOP and `Permissions-Policy`. web's CSP uses a fresh nonce per page. Completed on branch `feat-launch-headers`.
- **Accessibility audit** (P1): axe at WCAG 2.2 AA on every `web` and `admin` route, light and dark, desktop and phone, plus keyboard focus checks, found no violations. New E2E sweeps (`e2e/web/a11y.e2e.ts`, `e2e/admin/a11y.e2e.ts`) keep it that way. Completed on branch `feat-launch-a11y`.
- **Fix the flaky phone-menu E2E** (P1): the tap wasn't lost. The first navigation can end after the page is interactive, because the home page's chunk loads lazily, and its `NavigationEnd` closed a menu the tap had just opened. The menu now closes only on later navigations. Completed on branch `feat-launch-e2e-flake`.

- **Implement the admin authGuard** (P1): `authGuard` now requires a signed-in account with a `users/{uid}` doc, looked up by UID. Completed on branch `feat-auth`. **Completed:** v0.2.0.0 (2026-09-24)
- **Run E2E under the emulators** (P2): `pnpm e2e` runs under the Auth and Firestore emulators with the `emulator-data/` seed. Completed on branch `feat-auth`. **Completed:** v0.2.0.0 (2026-09-24)
- **Triage the backlog**: dropped six items that didn't fit a two-admin site (SSR Auth guard, prerender Firestore guard, admin bundle budget (budget raised to 1 MB warning / 1.5 MB error instead), narrow-screen email, `visible is bool` rule, Prettier hook hardening). Completed on branch `chore-trim-todos`. **Completed:** v0.2.1.0 (2026-09-24)
