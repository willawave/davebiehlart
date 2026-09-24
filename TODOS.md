# TODOS

Only items that break real use, risk production data, or block launch belong here (see AGENTS.md → Workflow).

## Before going live

**Priority:** P1

Do these when `web` and `admin` are first hosted from this repo (davebiehlart.com and admin.davebiehlart.com serve the legacy site today), alongside the rules deploy described in AGENTS.md.

- Paste the production web config into `projects/admin/src/environments/environment.ts` (still `options: {}`). The admin app shell starts Firebase on every page, so without it a production admin build throws `Firebase is not configured: projectId is empty` and renders blank. Dev builds and E2E use the emulators and can't catch this.
- Add `admin.davebiehlart.com` to Firebase Auth's authorized domains, or popup sign-in fails with `auth/unauthorized-domain`.
- If hosting sets `Cross-Origin-Opener-Policy`, use `same-origin-allow-popups`; `same-origin` breaks `signInWithPopup`.
- Re-run `/setup-deploy` so CLAUDE.md's "Deploy Configuration" records the platform, deploy trigger, status command, and health checks.

## Completed

- **Implement the admin authGuard** (P1): `authGuard` now requires a signed-in account with a `users/{uid}` doc, looked up by UID. Completed on branch `feat-auth`. **Completed:** v0.2.0.0 (2026-09-24)
- **Run E2E under the emulators** (P2): `pnpm e2e` runs under the Auth and Firestore emulators with the `emulator-data/` seed. Completed on branch `feat-auth`. **Completed:** v0.2.0.0 (2026-09-24)
- **Triage the backlog**: dropped six items that didn't fit a two-admin site (SSR Auth guard, prerender Firestore guard, admin bundle budget (budget raised to 1 MB warning / 1.5 MB error instead), narrow-screen email, `visible is bool` rule, Prettier hook hardening). Completed on branch `chore-trim-todos`.
