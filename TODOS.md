# TODOS

## Admin app

### Implement the admin authGuard

**Priority:** P1

`projects/admin/src/app/auth/auth-guard.ts` returns `true` for every navigation. Before the admin app gets production Firebase config, require a signed-in user whose `users/{auth.uid}` document exists (`getDoc`, never an email query), and add a test that a non-admin is redirected. Firestore/Storage rules already enforce admin-only writes.

Found on branch `feat-dev-tooling` (/ship pre-landing review).

## Core / Firebase

### Keep Firebase Auth off the server render

**Priority:** P1

`FIREBASE_AUTH` is provided in root and backed by one process-wide app, so on the SSR web app a single Auth instance (and its `currentUser`) would be shared across all requests. Make `FIREBASE_AUTH` throw on the server platform (`isPlatformServer`) before any server code path touches Auth.

Found on branch `feat-dev-tooling` (/ship adversarial review).

## CI

### Guard prerender against live Firestore reads

**Priority:** P1

Once production config is added to `projects/web/src/environments/environment.ts`, `ng build web` prerenders contact/privacy/terms with it, so any app-shell component that injects `FIRESTORE` would read production from CI. Add a structural guard (e.g. a server-only provider that throws on `FIRESTORE` during prerender, or a test that prerendered routes never inject it).

Found on branch `feat-dev-tooling` (/ship red-team review).

### Run E2E under the emulators

**Priority:** P2

The CI e2e job starts no emulators. Before the first store reads Firestore, wrap `pnpm e2e` in `firebase emulators:exec --project demo-bronze-horse` (the ID must match `EMULATOR_FIREBASE_ENVIRONMENT`).

Found on branch `feat-dev-tooling` (/ship adversarial review).

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

### Re-run /setup-deploy when hosting goes live

**Priority:** P2

The "Deploy Configuration" in CLAUDE.md is merge-only (platform `none`), so `/land-and-deploy` merges and skips deploy verification. Once `web` and `admin` are actually served from this repo (davebiehlart.com and admin.davebiehlart.com, which today serve the legacy site), re-run `/setup-deploy` to record the platform, deploy trigger, status command, and health checks.

Found on branch `feat-dev-tooling` (/setup-deploy).

## Completed
