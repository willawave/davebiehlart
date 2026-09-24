# TODOS

## Core / Firebase

### Keep Firebase Auth off the server render

**Priority:** P1

`FIREBASE_AUTH` is provided in root and backed by one process-wide app, so on the SSR web app a single Auth instance (and its `currentUser`) would be shared across all requests. Make `FIREBASE_AUTH` throw on the server platform (`isPlatformServer`) before any server code path touches Auth.

Found on branch `feat-dev-tooling` (/ship adversarial review).

## Admin UI

### Bring the admin initial bundle back under its budget

**Priority:** P2

`ng build admin` reports the initial bundle at about 821 kB raw (208 kB transfer), over the 500 kB warning budget and about 180 kB short of the 1 MB error budget. The app shell injects `AuthStore`, which pulls in `AuthService` and with it the full `firebase/firestore` and `firebase/auth` SDKs, just for one `getDoc(users/{uid})`. Load Firestore lazily for the admin check (for example a lazily resolved `FIRESTORE` token or `firebase/firestore/lite` for one-shot reads) and consider `initializeAuth` with explicit persistence in place of `getAuth`, keeping one SDK per core token file. Do it before the next Firebase-heavy admin feature pushes the build past 1 MB.

Found on branch `feat-auth` (/ship performance review).

### Show the signed-in email on narrow screens

**Priority:** P3

At 375px wide the admin toolbar truncates the signed-in email to "a…" beside the Sign out button. The dashboard still shows the full email, so nothing is lost; consider hiding the toolbar email below a breakpoint or moving it into a menu.

Found on branch `feat-auth` (/qa, 2026-09-24).

## CI

### Guard prerender against live Firestore reads

**Priority:** P1

Once production config is added to `projects/web/src/environments/environment.ts`, `ng build web` prerenders contact/privacy/terms with it, so any app-shell component that injects `FIRESTORE` would read production from CI. Add a structural guard (e.g. a server-only provider that throws on `FIRESTORE` during prerender, or a test that prerendered routes never inject it).

Found on branch `feat-dev-tooling` (/ship red-team review).

## Security rules

### Type-check `visible` on content writes

**Priority:** P2

Content writes are admin-only but unvalidated. A `visible` stored as a string or left out silently hides an item from every public list (`canList` requires `== true`). Add `request.resource.data.visible is bool` to content write rules, with rules tests, and deploy deliberately.

Found on branch `feat-dev-tooling` (/ship adversarial review).

## Tooling

### Harden the committed Prettier hook

**Priority:** P3

`.claude/settings.json` runs `pnpm exec prettier --write` on every edited file. A branch from a fork can change the Prettier config or plugins that then run locally while Claude edits, and the path check doesn't normalize `..`. Resolve the path with `realpath` before the prefix check and add CODEOWNERS for `.claude/` and the Prettier config.

Found on branch `feat-dev-tooling` (/ship adversarial review).

### Add the admin production Firebase config before hosting

**Priority:** P1

`projects/admin/src/environments/environment.ts` still has `options: {}`. Since `feat-auth`, the admin app shell injects `AuthStore` on every page, which starts Firebase, so a production admin build throws `Firebase is not configured: projectId is empty` at startup and renders blank. Dev builds and E2E use the emulator config and can't catch it. Paste the production web config before the admin app is hosted, alongside the rules deploy in AGENTS.md. At the same time:

- Add `admin.davebiehlart.com` to Firebase Auth's authorized domains, or popup sign-in fails with `auth/unauthorized-domain`.
- Check popup sign-in still works once hosting sets headers: `Cross-Origin-Opener-Policy: same-origin` breaks `signInWithPopup` (use `same-origin-allow-popups`).
- Add a Content Security Policy for the admin app (self, the Firebase/gapi origins, and Google Fonts, which `projects/admin/src/index.html` loads), or self-host the font.

Found on branch `feat-auth` (/review, Codex).

### Re-run /setup-deploy when hosting goes live

**Priority:** P2

The "Deploy Configuration" in CLAUDE.md is merge-only (platform `none`), so `/land-and-deploy` merges and skips deploy verification. Once `web` and `admin` are actually served from this repo (davebiehlart.com and admin.davebiehlart.com, which today serve the legacy site), re-run `/setup-deploy` to record the platform, deploy trigger, status command, and health checks.

Found on branch `feat-dev-tooling` (/setup-deploy).

## Completed

- **Implement the admin authGuard** (P1): `authGuard` now requires a signed-in account with a `users/{uid}` doc, looked up by UID. Completed on branch `feat-auth`. **Completed:** v0.2.0.0 (2026-09-24)
- **Run E2E under the emulators** (P2): `pnpm e2e` runs under the Auth and Firestore emulators with the `emulator-data/` seed. Completed on branch `feat-auth`. **Completed:** v0.2.0.0 (2026-09-24)
