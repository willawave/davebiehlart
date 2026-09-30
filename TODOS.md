# TODOS

Only items that break real use, risk production data, or block launch belong here (see AGENTS.md → Workflow).

## Before going live

**Priority:** P1

Do these when `web` and `admin` are first hosted from this repo (davebiehlart.com and admin.davebiehlart.com serve the legacy site today), alongside the rules deploy described in AGENTS.md.

- Add `admin.davebiehlart.com` to Firebase Auth's authorized domains, or popup sign-in fails with `auth/unauthorized-domain`.
- If hosting sets `Cross-Origin-Opener-Policy`, use `same-origin-allow-popups`; `same-origin` breaks `signInWithPopup`.
- Re-run `/setup-deploy` so CLAUDE.md's "Deploy Configuration" records the platform, deploy trigger, status command, and health checks.
- Fix the flaky phone-menu E2E (`e2e/web/navigation.e2e.ts`, "phone" tests): under parallel load, a tap on "Open menu" right after `goto('/')` is sometimes lost, so the drawer never opens and "Close menu" is never focused. It fails about 1 in 345 runs on v0.10 and about 1 in 115 since the Monument Night home page. Hydration isn't slower (about 25 ms), and event replay (`withEventReplay`) is on, so find out why the tap is dropped. A clue from `feat-nav-feedback-sticky-header`: preloading every route chunk right at startup (`PreloadAllModules`) raised the rate to 3 in 40 isolated runs, while preloading only after `ApplicationRef.whenStable()` kept it at `main`'s rate (about 2 in 312 under load). Main-thread work around hydration seems to be what drops the tap. Real visitors who tap the menu before the page finishes loading could hit it too.

## Completed

- **Implement the admin authGuard** (P1): `authGuard` now requires a signed-in account with a `users/{uid}` doc, looked up by UID. Completed on branch `feat-auth`. **Completed:** v0.2.0.0 (2026-09-24)
- **Run E2E under the emulators** (P2): `pnpm e2e` runs under the Auth and Firestore emulators with the `emulator-data/` seed. Completed on branch `feat-auth`. **Completed:** v0.2.0.0 (2026-09-24)
- **Triage the backlog**: dropped six items that didn't fit a two-admin site (SSR Auth guard, prerender Firestore guard, admin bundle budget (budget raised to 1 MB warning / 1.5 MB error instead), narrow-screen email, `visible is bool` rule, Prettier hook hardening). Completed on branch `chore-trim-todos`. **Completed:** v0.2.1.0 (2026-09-24)
