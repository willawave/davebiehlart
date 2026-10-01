# TODOS

Only items that break real use, risk production data, or block launch belong here (see AGENTS.md → Workflow).

## Before going live

**Priority:** P1

Do these when `web` and `admin` are first hosted from this repo (davebiehlart.com and admin.davebiehlart.com serve the legacy site today, from its own App Hosting backends), alongside the rules deploy described in AGENTS.md.

- Run the first full deploy (rules and indexes) in [docs/DEPLOY.md](docs/DEPLOY.md). The one-time setup and the apps-only trial deploy are done (2026-09-30); don't run the Deploy workflow before this.
- Before switching DNS, check `web` and `admin` against real production data on their `hosted.app` / `web.app` URLs (docs/DEPLOY.md → Cutover, step 1). In `admin`, look but don't save; it writes to production.
- Run the pre-launch audits: `/cso`, `/design-review`, and unit/E2E coverage. (The SEO audit is done on `feat-launch-seo`.)
- Verify davebiehlart.com in Google Search Console and submit the sitemap after cutover. No analytics for now.
- Turn on backups before the first rules deploy (docs/DEPLOY.md → One-time setup, step 3). The rollback steps are in docs/DEPLOY.md → Rollback.
- Retire the legacy admin and stop the legacy repo from deploying: agree with both admins when they switch to admin.davebiehlart.com so edits don't split between the two apps, then turn off the legacy backends' automatic rollouts and archive `bbiehl/the-bronze-horse-angular`, whose rules deploy would bring back the old rules (docs/DEPLOY.md → Cutover).
- Record a `/benchmark` baseline. It needs an optimized (production-mode) build pointed at the emulators, which doesn't exist yet; after launch, benchmark production.
- Add `admin.davebiehlart.com` to Firebase Auth's authorized domains, or popup sign-in fails with `auth/unauthorized-domain`.
- Re-run `/setup-deploy` so CLAUDE.md's "Deploy Configuration" records the platform, deploy trigger, status command, and health checks.

## Completed

- **iPhone pages hanging** (P1): on iOS, taps sometimes hung forever because iOS kills Firestore's long-lived browser connection and the SDK waits on it. A browser read that takes over 6 seconds, or fails, now loads the page from the server instead; a failed detail read no longer shows "Page not found". Completed on branch `feat-launch-mobile-nav`.
- **Security headers** (P1): `web` (server.ts) and `admin` (firebase.json) send HSTS, a Content-Security-Policy, `nosniff`, `Referrer-Policy`, `X-Frame-Options`, COOP and `Permissions-Policy`. web's CSP uses a fresh nonce per page. Completed on branch `feat-launch-headers`.
- **Accessibility audit** (P1): axe at WCAG 2.2 AA on every `web` and `admin` route, light and dark, desktop and phone, plus keyboard focus checks, found no violations. New E2E sweeps (`e2e/web/a11y.e2e.ts`, `e2e/admin/a11y.e2e.ts`) keep it that way. Completed on branch `feat-launch-a11y`.
- **Fix the flaky phone-menu E2E** (P1): the tap wasn't lost. The first navigation can end after the page is interactive, because the home page's chunk loads lazily, and its `NavigationEnd` closed a menu the tap had just opened. The menu now closes only on later navigations. Completed on branch `feat-launch-e2e-flake`.

- **Implement the admin authGuard** (P1): `authGuard` now requires a signed-in account with a `users/{uid}` doc, looked up by UID. Completed on branch `feat-auth`. **Completed:** v0.2.0.0 (2026-09-24)
- **Run E2E under the emulators** (P2): `pnpm e2e` runs under the Auth and Firestore emulators with the `emulator-data/` seed. Completed on branch `feat-auth`. **Completed:** v0.2.0.0 (2026-09-24)
- **Triage the backlog**: dropped six items that didn't fit a two-admin site (SSR Auth guard, prerender Firestore guard, admin bundle budget (budget raised to 1 MB warning / 1.5 MB error instead), narrow-screen email, `visible is bool` rule, Prettier hook hardening). Completed on branch `chore-trim-todos`. **Completed:** v0.2.1.0 (2026-09-24)
