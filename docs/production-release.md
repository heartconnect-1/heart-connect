# Heart Connect Production Release Procedure

## Purpose

Heart Connect uses a live-only release model:

`GitHub → GitHub Actions → Cloudflare Workers → royal-heart.com → Supabase`

There is no required staging website, staging database, localhost server, or preview deployment in the production release path.

## Production release approval

1. Changes are proposed through a short-lived branch and pull request.
2. Pull-request CI must pass.
3. The change is merged into `main` through the repository's protected-main rules.
4. A push to `main` starts the verification workflow.
5. The `production` GitHub Environment must be configured by the Project Owner with:
   - required reviewer(s);
   - Prevent self-review enabled;
   - deployment branch restriction allowing only `main`;
   - administrator bypass disabled;
   - environment secrets:
     - `PRODUCTION_CLOUDFLARE_API_TOKEN`
     - `PRODUCTION_CLOUDFLARE_ACCOUNT_ID`
     - `PRODUCTION_HEART_CONNECT_OWNER_EMAILS`
6. The production deployment job remains pending until the required reviewer approves it.
7. Only after approval does the job receive the environment secrets and execute the Cloudflare deployment.

Do not place the production deployment credentials in workflow files.

## Release execution

The production deployment job:

- runs only for a push to `main`;
- depends on the complete verification job;
- checks out the exact `GITHUB_SHA`;
- verifies that the checked-out commit equals `GITHUB_SHA`;
- records the Git SHA and workflow run in the Actions job summary;
- builds from that exact commit;
- deploys using `wrangler.router.jsonc`;
- configures the existing owner-access Worker secret;
- serializes production deployments through the `heart-connect-production` concurrency group.

Pull-request runs never enter the production deployment job.

## Live-domain smoke tests

Smoke tests run only after the production deployment job succeeds.

They verify:

- `/admin/login`
- unauthenticated `/admin` redirect
- unauthenticated member session API denial
- unauthenticated Admin API denial
- `/login`
- `/signup`
- `/app`
- homepage `/`
- `/api/public/homepage`

No destructive member-data tests or real payment charges are performed.

## Production deployment identification

Every production release records:

- repository;
- `main` ref;
- exact Git commit SHA;
- GitHub workflow run ID;
- workflow run number;
- production target;
- Cloudflare Worker configuration.

The GitHub production environment also provides deployment history for jobs targeting `production`.

## Failed deployment handling

If deployment fails:

1. Do not repeatedly deploy speculative fixes.
2. Record the workflow run, Git SHA, Cloudflare output, affected feature, and error.
3. Determine whether immediate rollback is required.
4. Restore the previous verified release when appropriate.
5. Verify the live domain with the smoke suite.
6. Prepare the smallest corrective change on a new branch.
7. Run CI again.
8. Obtain production approval again.
9. Deploy the correction.
10. Re-run live smoke tests.

## Emergency rollback

Rollback means redeploying a previously verified Heart Connect release commit through the same protected production workflow.

The rollback release must:

- originate from `main`;
- pass the verification job;
- receive production approval;
- use the protected production environment;
- be identified by its exact Git SHA;
- pass live smoke tests after deployment.

Do not bypass the release control by deploying directly from a workstation or an unreviewed branch.

## Database migration rollback limitations

Application rollback and database rollback are separate concerns.

A previous application commit may depend on database objects introduced by a later migration. Therefore:

- do not assume an application rollback safely reverses database changes;
- do not automatically run reverse migrations in production;
- do not modify production RLS policies or member data as part of an application rollback;
- investigate migration compatibility before rolling an application back;
- use the database's established recovery/restore procedures for database incidents.

Database migrations require their own reviewed release decision.

## Incident reporting

For a production incident, record:

- incident date/time;
- affected production URL or API;
- deployed Git SHA;
- GitHub workflow run;
- Cloudflare deployment information available from the release;
- first detected symptom;
- affected feature;
- mitigation or rollback;
- live verification result;
- root cause when established;
- corrective action.

Never include secrets, access tokens, service-role keys, or private member data in incident reports.

## Release boundary

No production deployment is permitted until the Project Owner has verified the GitHub `production` environment protection settings and approved the release.

The workflow change in this repository intentionally does not configure those repository settings automatically.
