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

To change the seed data on purpose, edit it while the emulators run, then run `pnpm emulators:export` and commit `emulator-data/`. The seed is public, so it must only ever hold fake data; CI fails if it contains an email outside `@test.com`.

## Firebase config is not a secret

`projects/web/src/environments/environment.ts` and `projects/admin/src/environments/environment.ts` hold the production Firebase web config (`apiKey`, `appId`, `projectId`, and so on) in plain sight, in a public repo. That is safe, and it is how Firebase is designed to work:

- **It only identifies the project.** The config tells Google's servers which Firebase project a request is for. It grants no access by itself, so it isn't a password or a service-account key.
- **It ships to every visitor anyway.** Any web app that talks to Firebase has to send this config to the browser, where anyone can read it from the page's JavaScript. Hiding it in the repo would protect nothing.
- **The security rules are the lock.** `firestore.rules` and `storage.rules` decide who can read and write what, and `pnpm test:rules` tests them. Visitors can read only published content. Only an admin can write, and an admin is an account whose UID has a document in the `users` collection. Those documents are created by hand in the Firebase console and can't be created from any app. Cloning this repo and running it with the real config gets you nothing the public site doesn't already show.
- **Development can't reach production.** Development builds, unit tests and E2E swap in `environment.development.ts`, which uses a `demo-` project on the local emulators. The Firebase providers refuse to start a development build that points anywhere else.

Real secrets, such as service-account JSON or admin SDK credentials, never belong in this repo.

To limit abuse of the key (quota burn, not data access), restrict it **by API** in Google Cloud Console → APIs & Services → Credentials. Don't restrict it by HTTP referrer: `web` renders pages on the server, and those server-side Firestore requests carry no referrer, so a referrer-restricted key would break every server render.

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
