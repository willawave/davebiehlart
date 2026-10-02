# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

<!-- Project guardrails, architecture, commands, workflow, and Angular conventions live in
     AGENTS.md (imported above) so Codex and other agents get them too. Edit them there, not here.
     Keep this file for Claude Code-specific instructions only. -->

## Claude Code specifics

- A `.claude/settings.json` PostToolUse hook runs Prettier on every file you Write/Edit, so don't format by hand.
- Start in plan mode. Run `/design-shotgun` before UI work.
- Review, QA, and merge go through `/codex:review` → `/qa` (against local emulators) → `/ship` (opens the PR) → `/land-and-deploy` (merges once all gates pass).
- Keep `/ship` lightweight: `/codex:review` and `/qa` are the review gate, so don't run `/ship`'s coverage or plan audits, specialist or Red Team subagents, adversarial passes, fix loops, or doc-sync subagent. Just run the tests (unit, lint, web/admin E2E as touched, build), bump `VERSION` and `CHANGELOG.md`, push, and open the PR. Fix only failures that break real use; list anything else in the PR body. Ask before any multi-agent review.

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

Merging to `main` does not deploy. Production deploys only through the Deploy workflow, run by hand on `main` (docs/DEPLOY.md → "Routine deploys"). Every run deploys the Firestore/Storage rules and indexes along with both apps, so it is a production write: start it only after the user says yes in that session.

- Platform: Firebase, deployed by GitHub Actions. `web` is the App Hosting backend `web` (SSR); `admin` is the Hosting site `davebiehlart-admin`
- Production URL: https://davebiehlart.com (web), https://admin.davebiehlart.com (admin)
- Deploy workflow: `.github/workflows/deploy.yml` (`workflow_dispatch`, `main` only; it refuses a commit whose CI run on `main` hasn't passed)
- Deploy status command: `gh run list --workflow deploy.yml --branch main --limit 1 --json databaseId,headSha,status,conclusion`
- Merge method: squash, through the GitHub merge queue (the "Protect main" ruleset requires it; `gh pr merge --squash` enqueues the PR, and `--delete-branch` is rejected, so delete the branch after the merge)
- Project type: web app (SSR `web` + `admin` SPA)
- Post-deploy health check: both production URLs return 200. After a deploy, an admin also tests one photo upload (AGENTS.md → "Production data guardrails"); a session never does that itself

### Custom deploy hooks

- Pre-merge: none (the merge queue runs `.github/workflows/ci.yml` on each PR on top of `main` before merging)
- Deploy trigger: `gh workflow run deploy.yml --ref main`, only after the user says yes in that session; skip it for changes that don't alter what's served (docs, tests, CI)
- Deploy status: `gh run watch <run-id> --exit-status`, and confirm the run's `headSha` is the merge commit
- Health check: `curl -s -o /dev/null -w '%{http_code}' https://davebiehlart.com/` and the same for https://admin.davebiehlart.com/, expecting 200
