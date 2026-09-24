# Davebiehlart

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.8.

It is an Angular monorepo with three projects: `web` (the public, server-rendered site), `admin` (the auth-protected admin app), and `core` (shared models, constants, and Firebase providers). See [PROJECT.md](PROJECT.md) for goals and scope, and [AGENTS.md](AGENTS.md) for architecture, production-data guardrails, and the full command reference.

## Prerequisites

- Node.js 24 (see `.nvmrc`) and pnpm (`corepack enable`)
- Java 21 or later, for the Firebase emulators (`pnpm start`, `pnpm test:rules`, `pnpm e2e`)

Install dependencies:

```bash
pnpm install
```

## Development server

To run both apps against local Firebase emulators, run:

```bash
pnpm start
```

This starts the web app at `http://localhost:4200/`, the admin app at `http://localhost:4201/`, and the emulator UI at `http://localhost:4010/`. The emulators start from the fake test data in `emulator-data/` (sign in to admin as `admin@test.com`; `outsider@test.com` is a non-admin), and changes are discarded when you stop them with Ctrl-C. Development builds only ever talk to the emulators, never the production Firebase project.

To run the emulators alone, use `pnpm emulators`.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
pnpm ng generate component component-name --project web
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
pnpm ng generate --help
```

## Building

To build a project, run:

```bash
pnpm ng build web
```

Use `core`, `web`, or `admin` as the project name. Build artifacts go to the `dist/` directory.

## Running tests

| Command                                         | What it runs                                                                       |
| ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| `pnpm ng test <web\|admin\|core> --watch=false` | [Vitest](https://vitest.dev/) unit tests for one project                           |
| `pnpm test:rules`                               | Firestore and Storage security rules tests against the emulators                   |
| `pnpm e2e`                                      | [Playwright](https://playwright.dev/) tests for web and admin, under the emulators |
| `pnpm lint`                                     | ESLint (angular-eslint)                                                            |

CI (`.github/workflows/ci.yml`) runs formatting, lint, unit tests, builds, rules tests, and E2E on every pull request.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
