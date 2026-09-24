# Changelog

All notable changes to this project are documented here.

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
