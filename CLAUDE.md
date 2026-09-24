# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

<!-- Shared TypeScript/Angular/accessibility conventions live in AGENTS.md (imported above)
     so Codex and other agents get them too. Edit them there, not here.
     Keep this file for Claude Code-specific instructions only. -->

## Architecture

- `web`: public, SSR, SEO-optimized. `admin`: auth-protected routes, `noindex`, role/claim checks. `core`: shared library (models, constants).
- Data flow is always Component → SignalStore (`@ngrx/signals`) → Service → Firebase SDK. Components never touch Firebase.
- Import shared code via the `core` path alias (`import { StatueDocument } from 'core'`), never relative `../core/src/...` paths. The alias resolves to `dist/core`, so export new symbols from `projects/core/src/public-api.ts` and run `pnpm ng build core` before building/testing web or admin. Migrate relative imports when touching a file.
- SignalStore state keys are camelCase (some admin stores use PascalCase — fix when touching them).

## Commands

- Package manager is pnpm. Unit tests (Vitest via Angular builder), per project: `pnpm ng test <web|admin|core> --watch=false`
- Format with Prettier (`.prettierrc`: 100 cols, single quotes).

## Workflow

- Plan mode first. Branch `feat-<feature>` off `main`. Run `/design-shotgun` before UI work.
- An approved plan is consent to create the files and add the dependencies it names. Anything outside the approved plan — new files or new dependencies — needs explicit approval first.
- New code ships with Vitest unit tests; user-facing flows also need Playwright E2E tests.
- Never merge a PR to `main` that hasn't passed `/review`, `/qa`, and CI.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
