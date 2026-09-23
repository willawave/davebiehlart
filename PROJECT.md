This workspace is an Angular monorepo (web app + admin app + core library) built on top of an existing Firebase project "The Bronze Horse" with real, live production data. The public repository is hosted on GitHub under “github.com/davebiehlart". Upon completion, web app will be pointed to https://davebiehlart.com and admin app will be pointed to https://admin.davebiehlart.com repspectively.

# Stack

- Frontend: Angular 22
- UX components: Angular Material 22
- State Management: @ngrx/signals
- Unit Testing: Vitest
- E2E Testing: Playwright
- Auth: Firebase Auth
- Data: Firebase Firestore
- Storage: Firebase Cloud Storage

# Musts

- Enforce Unit test coverage.
- Enforce E2E test coverage
- Enforce Firestore and Storage Rules.
- CI actions run on all pull requests and merges to main
- Avoid firebase calls directly in components. Use this chain Component -> SignalStore -> service -> Firebase SDK
- Users can only be manually created/updated/deleted via the existing Firestore ‘users’ collection.

## Development process

We will follow the following process: think -> plan -> design -> build -> review -> QA -> ship

1. Plan Mode first.
2. Cut feature branch “feat-<feature>
3. /design-shotgun if touching UI.
4. Auto mode, when building out the code, automatically choose Claude’s recommendations without requiring my approval.
5. /review feature branch, automatically choose Claude’s recommendations without requiring my approval.
6. /qa feature branch via local emulators.
7. /ship When a PR passes all quality gates, merge it into ‘main’.

# Must not

- Claude must not add, edit, or delete to production Firestore or Storage.
- Generate files without my consent.
- Add dependencies without my consent.
- Merge unreviewed pull requests to main.
- Alter existing data structures (because we’re using existing production data).

# Responsibilities

## Web app

- Public-facing routes.
- SEO optimization.
- Data read only.

## Admin app

- Protected admin routes.
- SEO noindex.
- Role/claim checks.
- Data moderation flows.
- Admin-only Firestore/Storage operations, enforced by Firestore/Storage rules.

# Features

[ ] Auth Feature: Admin app only. Auth and user sign-in/out. Users can only be manually created/updated/destroyed via the Firebase ‘users’ collection. Under no circumstance may someone be able to clone the public repo, create a user, and self-promote to admin status.
[ ] Gallery Feature
[ ] Statue Feature
[ ] Event Feature
[ ] Media Feature
[ ] Schedule Feature: admin must be able to set weekly schedule, web app must be able to display schedule.
[ ] Breadcrumbs Feature
[ ] Static pages: Web app only. Contact, Privacy Policy, Terms of Use, Not Found.
