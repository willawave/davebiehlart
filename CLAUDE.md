# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

<!-- Project guardrails, architecture, commands, workflow, and Angular conventions live in
     AGENTS.md (imported above) so Codex and other agents get them too. Edit them there, not here.
     Keep this file for Claude Code-specific instructions only. -->

## Claude Code specifics

- A `.claude/settings.json` PostToolUse hook runs Prettier on every file you Write/Edit, so don't format by hand.
- Start in plan mode. Run `/design-shotgun` before UI work.
- Review, QA, and merge go through `/review` → `/qa` (against local emulators) → `/ship` (opens the PR) → `/land-and-deploy` (merges once all gates pass).

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

## Deploy Configuration (configured by /setup-deploy)

Nothing deploys from `main` yet: no hosting target in `firebase.json`, no deploy workflow. davebiehlart.com currently serves the legacy site, so health-checking it proves nothing about this repo. Re-run `/setup-deploy` when hosting goes live (see TODOS.md → "Re-run /setup-deploy when hosting goes live").

- Platform: none (not deployed yet)
- Production URL: none (planned: https://davebiehlart.com for web, https://admin.davebiehlart.com for admin)
- Deploy workflow: none
- Deploy status command: none
- Merge method: squash, through the GitHub merge queue (the "Protect main" ruleset requires it; `gh pr merge --squash` enqueues the PR)
- Project type: web app (SSR `web` + `admin` SPA)
- Post-deploy health check: none (skip deploy verification)

### Custom deploy hooks

- Pre-merge: none (the merge queue runs `.github/workflows/ci.yml` on each PR on top of `main` before merging)
- Deploy trigger: none
- Deploy status: none
- Health check: none
