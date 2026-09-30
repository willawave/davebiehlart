# TODOS

Only items that break real use, risk production data, or block launch belong here (see AGENTS.md → Workflow).

## Before going live

**Priority:** P1

Do these when `web` and `admin` are first hosted from this repo (davebiehlart.com and admin.davebiehlart.com serve the legacy site today, from its own App Hosting backends), alongside the rules deploy described in AGENTS.md.

- Run the one-time setup (App Hosting backend, admin Hosting site, backups, Workload Identity Federation) and the first local deploy in [docs/DEPLOY.md](docs/DEPLOY.md). Until then, the Deploy workflow can't sign in.
- Before switching DNS, check `web` and `admin` against real production data on their `hosted.app` / `web.app` URLs (docs/DEPLOY.md → Cutover, step 1). In `admin`, look but don't save; it writes to production.
- Run the pre-launch audits: SEO (meta, Open Graph, canonical, JSON-LD, `robots.txt`, `sitemap.xml`, `llms.txt`), `/cso`, `/design-review`, and unit/E2E coverage.
- Audit accessibility on every `web` and `admin` route: axe checks plus keyboard and focus order (WCAG AA). `/design-review` doesn't cover this.
- Set security headers in the hosting config: HSTS, a CSP that allows Firebase, `X-Content-Type-Options: nosniff`, `Referrer-Policy`.
- Verify davebiehlart.com in Google Search Console and submit the sitemap after cutover. No analytics for now.
- Turn on backups before the first rules deploy (docs/DEPLOY.md → One-time setup, step 3). The rollback steps are in docs/DEPLOY.md → Rollback.
- Retire the legacy admin and stop the legacy repo from deploying: agree with both admins when they switch to admin.davebiehlart.com so edits don't split between the two apps, then turn off the legacy backends' automatic rollouts and archive `bbiehl/the-bronze-horse-angular`, whose rules deploy would bring back the old rules (docs/DEPLOY.md → Cutover).
- Record a `/benchmark` baseline. It needs an optimized (production-mode) build pointed at the emulators, which doesn't exist yet; after launch, benchmark production.
- Add `admin.davebiehlart.com` to Firebase Auth's authorized domains, or popup sign-in fails with `auth/unauthorized-domain`.
- Re-run `/setup-deploy` so CLAUDE.md's "Deploy Configuration" records the platform, deploy trigger, status command, and health checks.
- Fix the flaky phone-menu E2E (`e2e/web/navigation.e2e.ts`, "phone" tests): under parallel load, a tap on "Open menu" right after `goto('/')` is sometimes lost, so the drawer never opens and "Close menu" is never focused. It fails about 1 in 345 runs on v0.10 and about 1 in 115 since the Monument Night home page. Hydration isn't slower (about 25 ms), and event replay (`withEventReplay`) is on, so find out why the tap is dropped. A clue from `feat-nav-feedback-sticky-header`: preloading every route chunk right at startup (`PreloadAllModules`) raised the rate to 3 in 40 isolated runs, while preloading only after `ApplicationRef.whenStable()` kept it at `main`'s rate (about 2 in 312 under load). Main-thread work around hydration seems to be what drops the tap. Real visitors who tap the menu before the page finishes loading could hit it too.

## Completed

- **Implement the admin authGuard** (P1): `authGuard` now requires a signed-in account with a `users/{uid}` doc, looked up by UID. Completed on branch `feat-auth`. **Completed:** v0.2.0.0 (2026-09-24)
- **Run E2E under the emulators** (P2): `pnpm e2e` runs under the Auth and Firestore emulators with the `emulator-data/` seed. Completed on branch `feat-auth`. **Completed:** v0.2.0.0 (2026-09-24)
- **Triage the backlog**: dropped six items that didn't fit a two-admin site (SSR Auth guard, prerender Firestore guard, admin bundle budget (budget raised to 1 MB warning / 1.5 MB error instead), narrow-screen email, `visible is bool` rule, Prettier hook hardening). Completed on branch `chore-trim-todos`. **Completed:** v0.2.1.0 (2026-09-24)
