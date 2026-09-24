You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## Production data guardrails

This repo is wired to the live Firebase project "The Bronze Horse" with real production data, and the repo is public.

- Never add, edit, or delete production Firestore or Storage data. Anything that writes data runs against the emulators (`pnpm emulators`) under a `demo-*` project ID. Never add a `.firebaserc` or run `firebase deploy` / `--project <real id>` without explicit approval.
- `firestore.rules` and `storage.rules` mirror the rules live on production. Change them only with explicit approval, and every change needs a matching test in `tests/rules/` (`pnpm test:rules`).
- Do not change existing Firestore document shapes. Models in `projects/core/src/lib/models/` mirror the production schema.
- Users are created/updated/deleted only manually in the Firestore `users` collection. No code path may create users or grant admin roles/claims; admin access must be enforced by Firestore/Storage rules, not just client-side guards — assume anyone can clone the repo.
- `web` is read-only: no Firestore/Storage writes from `projects/web`.

## Architecture

- `web`: public, SSR, SEO-optimized. `admin`: auth-protected routes, `noindex`, role/claim checks. `core`: shared library (models, constants).
- Data flow is always Component → SignalStore (`@ngrx/signals`) → Service → Firebase SDK. Components never touch Firebase.
- Services get Firebase through core's `FIRESTORE` / `FIREBASE_AUTH` / `FIREBASE_STORAGE` injection tokens (`projects/core/src/lib/firebase/`), never `getFirestore()` etc. directly. Each SDK is imported only by its own `*.token.ts` file so an app bundles just the SDKs it injects — keep SDK imports out of `firebase.providers.ts` (type-only imports there). Development builds (`environment.development.ts`) use `EMULATOR_FIREBASE_ENVIRONMENT` and connect to the emulators; the providers refuse to start if emulators are paired with a non-`demo-` project ID. Production config lives in each app's `environment.ts` (empty until the first Firebase feature ships).
- Import shared code via the `core` path alias (`import { StatueDocument } from 'core'`), never relative `../core/src/...` paths. The alias points at core's source (`projects/core/src/public-api.ts`), so there is no core build step — but every new shared symbol must be exported from `public-api.ts`.
- SignalStore state keys are camelCase.

## Commands

- Package manager is pnpm. Unit tests (Vitest via Angular builder), per project: `pnpm ng test <web|admin|core> --watch=false`
- `pnpm lint` (angular-eslint; `_`-prefixed params are allowed as unused placeholders in stubs).
- `pnpm test:rules` — Firestore/Storage rules tests (`tests/rules/`, node:test) against emulators; needs Java.
- `pnpm start` — manual testing: emulators (UI at http://localhost:4000) plus web (http://localhost:4200) and admin (http://localhost:4201) dev servers. Data starts empty and is discarded on exit (no import/export). Ctrl-C stops everything.
- `pnpm emulators` — emulators alone under `demo-bronze-horse`.
- `pnpm e2e` — Playwright smoke suites in `e2e/{web,admin}/*.e2e.ts` (Playwright only matches `*.e2e.ts`); starts both dev servers itself.
- Prettier (100 cols, single quotes). CI checks formatting only on files a change touches, so format the files you change and never run a repo-wide `pnpm format`.

## Workflow

- Plan before building. Branch `feat-<feature>` off `main`.
- An approved plan is consent to create the files and add the dependencies it names. Anything outside the approved plan — new files or new dependencies — needs explicit approval first.
- New code ships with Vitest unit tests; user-facing flows also need Playwright E2E tests.
- Never merge a PR to `main` that hasn't passed code review, QA, and CI.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `model()` for two-way bound properties with `[(prop)]` syntax instead of pairing `input()` with `output()`
- Use `computed()` for derived state
- Use `linkedSignal()` for state derived from multiple reactive sources that must stay synchronized
- Prefer inline templates for small components
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- Do NOT import `CommonModule`, import only the directives and pipes the template uses, such as `AsyncPipe` or `DatePipe`
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection
