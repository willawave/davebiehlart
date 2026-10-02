# Deploying davebiehlart.com

Everything here acts on the live Firebase project `the-bronze-horse-b3aa2`. Read AGENTS.md → "Production data guardrails" first.

## What deploys where

| Piece                              | Hosting                                    | Default URL                                                |
| ---------------------------------- | ------------------------------------------ | ---------------------------------------------------------- |
| `web` (SSR)                        | App Hosting backend `web` (`us-central1`)  | https://web--the-bronze-horse-b3aa2.us-central1.hosted.app |
| `admin` (static SPA)               | Firebase Hosting site `davebiehlart-admin` | https://davebiehlart-admin.web.app                         |
| `firestore.rules`, `storage.rules` | Firestore and Storage                      | —                                                          |
| `firestore.indexes.json`           | Firestore composite indexes                | —                                                          |

One command deploys all of them, so rules and indexes always ship with the code that needs them:

```sh
pnpm exec firebase deploy --only firestore,storage,apphosting,hosting --project the-bronze-horse-b3aa2
```

- `firestore` covers rules and indexes. Rules that haven't changed are skipped. Indexes in production but missing from `firestore.indexes.json` are kept; the CLI never deletes them without being told to.
- Never drop the `--only` list. A bare `firebase deploy` is how things get deployed by accident.
- App Hosting builds `web` from the uploaded source using `apphosting.yaml`. The Angular adapter can't handle a workspace with two apps, so that file sets the build and run commands itself. `firebase.json` → `apphosting.ignore` keeps tests, the seed data and build output out of the upload.
- `admin` is built locally (`pnpm ng build admin`) and uploaded from `dist/admin/browser`. Build it, but never serve a production build of `admin` locally: it writes to production.

The legacy site also runs on App Hosting, as backends `davebiehlart` and `the-bronze-horse`, both rolled out from `bbiehl/the-bronze-horse-angular`. Leave them alone until the cutover below.

## Indexes

`firestore.indexes.json` is production's index list as of 2026-09-30 (`firebase firestore:indexes`). This repo's queries use only equality filters and need none of these indexes. They serve the legacy site:

| Collection | Fields                             |
| ---------- | ---------------------------------- |
| `event`    | `visible`, `date`                  |
| `gallery`  | `style`, `visible`, `created` desc |
| `media`    | `visible`, `date` desc             |
| `statue`   | `visible`, `dedicated` desc        |

After the legacy site is retired, remove any index nothing uses from the file and delete it in the console. Any new query that combines `where` with `orderBy`, or uses a range filter, needs an index added here; the emulators won't catch a missing one.

## One-time setup

Run these once, from a machine logged in as a project owner (`pnpm exec firebase login`, `gcloud auth login`).

```sh
P=the-bronze-horse-b3aa2
NUM=$(gcloud projects describe $P --format='value(projectNumber)')
```

1. **App Hosting backend for `web`.** `--non-interactive` creates it without a GitHub connection; the interactive setup always links one. Deploys come from the Deploy workflow, not automatic rollouts.

   ```sh
   pnpm exec firebase apphosting:backends:create --project $P --backend web --primary-region us-central1 --root-dir / --non-interactive
   ```

2. **Hosting site for `admin`.** If `davebiehlart-admin` is taken, pick another ID and update `firebase.json` → `hosting.site` and the table above.

   ```sh
   pnpm exec firebase hosting:sites:create davebiehlart-admin --project $P
   ```

3. **Backups**, before the first rules deploy:

   ```sh
   # Firestore: 7 days of point-in-time recovery, plus a daily backup kept for 14 days.
   gcloud firestore databases update --database='(default)' --enable-pitr --project $P
   gcloud firestore backups schedules create --database='(default)' --recurrence=daily --retention=14d --project $P
   # Storage: confirm soft delete is on (a retention duration greater than 0).
   gcloud storage buckets describe gs://the-bronze-horse-b3aa2.firebasestorage.app --format='default(soft_delete_policy)'
   ```

4. **Workload Identity Federation for the Deploy workflow.** GitHub proves who it is to Google Cloud without a stored key. Only this repository's `main` branch is trusted.

   ```sh
   gcloud iam workload-identity-pools create github --project $P --location global --display-name GitHub
   gcloud iam workload-identity-pools providers create-oidc davebiehlart --project $P --location global \
     --workload-identity-pool github \
     --issuer-uri https://token.actions.githubusercontent.com \
     --attribute-mapping 'google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref' \
     --attribute-condition "assertion.repository == 'willawave/davebiehlart' && assertion.ref == 'refs/heads/main'"

   gcloud iam service-accounts create github-deploy --project $P --display-name 'GitHub Deploy workflow'
   SA=github-deploy@$P.iam.gserviceaccount.com
   for role in roles/firebase.admin roles/firebaseapphosting.admin roles/storage.admin roles/iam.serviceAccountUser; do
     gcloud projects add-iam-policy-binding $P --member serviceAccount:$SA --role $role --condition None
   done
   gcloud iam service-accounts add-iam-policy-binding $SA --project $P --role roles/iam.workloadIdentityUser \
     --member "principalSet://iam.googleapis.com/projects/$NUM/locations/global/workloadIdentityPools/github/attribute.repository/willawave/davebiehlart"

   gh variable set GCP_WORKLOAD_IDENTITY_PROVIDER --body "projects/$NUM/locations/global/workloadIdentityPools/github/providers/davebiehlart"
   gh variable set GCP_DEPLOY_SERVICE_ACCOUNT --body "$SA"
   ```

   These roles are broader than needed. If a deploy fails with a permission error, the message names the missing permission; once deploys run cleanly, narrow the roles.

## Trial deploy (apps only)

Deploy `web` and `admin` to their default URLs without touching the rules, indexes or DNS. The legacy site keeps running unchanged, and both new apps work under production's current, looser rules. Use this to prove the hosting setup and to run audits and the real-data check against real hosting before the cutover.

1. **Authorize the admin's sign-in domain.** Firebase console → Authentication → Settings → Authorized domains → add `davebiehlart-admin.web.app` if it isn't listed (only the project's default domains are added automatically). Without it, popup sign-in fails with `auth/unauthorized-domain`.
2. On a clean checkout of `main`:
   ```sh
   pnpm install --frozen-lockfile
   pnpm ng build admin
   pnpm exec firebase deploy --only apphosting,hosting --project the-bronze-horse-b3aa2
   ```
   App Hosting builds `web` in the cloud; the first build takes several minutes.
3. Run the post-deploy checks below, except the upload check (no rules changed). If App Hosting's build fails, its log is under Firebase console → App Hosting → `web` → Rollouts.

Redeploy the apps the same way as often as needed. Don't run the Deploy workflow yet: it also deploys the rules, which go live only at the cutover.

## Why the rules wait for the cutover

The legacy site fails the pre-flight list in AGENTS.md → "Production data guardrails" (checked 2026-10-01 against `bbiehl/the-bronze-horse-angular` at `e8b0594`):

- Its home page loads upcoming events with no `visible == true` filter (`event.api.service.ts`, `getAllUpcomingEvents`). The new rules deny that query to visitors, and it runs in the home route's resolver, so the home page fails to load.
- Its admin finds admins by querying `users` by email (`auth.service.ts`). The new rules allow only `getDoc(users/{uid})`, so legacy sign-in fails.

Its list pages, detail pages and uploads pass. So the first full deploy (rules and indexes) is a step of the cutover, run once the legacy site no longer serves the domains. It runs locally because the CLI asks, once, to let the Storage service agent read Firestore; Storage's `isAdmin()` rule needs that.

## Routine deploys

Only after the cutover.

1. Merge the PR (the merge queue runs CI), and wait for CI on `main` to pass.
2. Actions → **Deploy** → Run workflow on `main`. It refuses to run until CI has passed on that commit.
3. Run the post-deploy checks.

## Post-deploy checks

- `web` renders on the server, not an empty shell:
  ```sh
  curl -s https://web--the-bronze-horse-b3aa2.us-central1.hosted.app/ | grep -o '<h1[^>]*>[^<]*'
  ```
  (After the cutover, use https://davebiehlart.com/.) No output means SSR fell back to client-side rendering. Check `angular.json` → web → `security.allowedHosts` covers the host.
- `admin` loads and signs in.
- After any rules change: upload one photo in `admin`.

## Rollback

| What broke    | Roll back                                                                                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rules         | Firebase console → Firestore (or Storage) → Rules → history → pick the previous version. Or run the deploy with `--only firestore:rules,storage` from an older commit. |
| Indexes       | Add the missing index back to `firestore.indexes.json` and redeploy, or create it in the console. Building takes minutes.                                              |
| `web`         | Firebase console → App Hosting → `web` → Rollouts → roll back to the previous rollout.                                                                                 |
| `admin`       | Firebase console → Hosting → `davebiehlart-admin` → Release history → Roll back.                                                                                       |
| Data          | Restore from point-in-time recovery or the daily backup into a new database, then copy back what's needed. Never restore over `(default)` without a fresh backup.      |
| Whole cutover | Move the custom domains back to the legacy backends (reverse the cutover steps).                                                                                       |

## Cutover from the legacy site

1. **Check real data first.** After the trial deploy (above), walk every `web` page on its `hosted.app` URL and every `admin` screen on its `web.app` URL: long titles, real photo sizes, missing alt text. In `admin`, look but don't save; it writes to production.
2. **Agree the switch date with both admins.** From then on, all edits go through the new admin; the legacy admin stops working at step 8.
3. **Confirm each admin's `users` document ID is their Auth UID** (Firebase console → Authentication → Users). The new rules and the new admin recognize admins only that way.
4. **Stop the legacy repo from deploying.** Turn off automatic rollouts on both legacy backends. Nobody may run `firebase deploy` from `bbiehl/the-bronze-horse-angular` from here on: it would bring back the old, looser rules.
5. **If there's time, a day ahead**, lower the TTL on davebiehlart.com's DNS records to 300 seconds.
6. **Authorize the admin domain.** Firebase console → Authentication → Settings → Authorized domains → add `admin.davebiehlart.com`.
7. **Move the domains.** A custom domain can belong to only one backend or site, so remove it from the legacy backend, then add it to the new one. HTTPS takes a few minutes, occasionally longer, to come up, so do this at a quiet time.
   - `davebiehlart.com` and `www.davebiehlart.com`: legacy App Hosting backend → Settings → Domains → remove; backend `web` → add both, with `www` redirecting to `davebiehlart.com`. Update DNS records if the console asks.
   - `admin.davebiehlart.com`: remove it from its legacy backend; Hosting → `davebiehlart-admin` → Add custom domain.
8. **Deploy the rules and indexes** once davebiehlart.com serves the new site (its responses carry a `Content-Security-Policy` header; the legacy site's don't). If the console had you change DNS records, also wait out their old TTL, since visitors still reaching the legacy site would get a broken home page. Confirm the backups from one-time setup exist, then on a clean checkout of `main`:
   ```sh
   pnpm install --frozen-lockfile
   pnpm ng build admin
   pnpm exec firebase deploy --only firestore,storage,apphosting,hosting --project the-bronze-horse-b3aa2
   ```
   Answer yes to the Storage → Firestore access prompt.
9. **Verify**: the post-deploy checks, on the real domains, including one upload in the new admin.
10. **Archive `bbiehl/the-bronze-horse-angular`.**
11. **Keep the legacy backends** until the new site has been stable for a few weeks, then delete them and prune unused indexes (see Indexes).
12. Re-run `/setup-deploy` so CLAUDE.md's Deploy Configuration records the live setup.
