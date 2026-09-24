# Changelog

All notable changes to this project are documented here.

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
