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
5. The Project Owner explicitly authorizes the production release by manually dispatching the workflow from `main` with the exact approved commit SHA.
6. The workflow verifies that the supplied SHA is a commit reachable from `main`, then builds and deploys that exact SHA.
7. Production credentials remain repository secrets and are referenced only by the production deployment job.

Do not place the production deployment credentials in workflow files.

## Release execution

The production deployment job:

- runs only for a manual `workflow_dispatch` from `main`;
- depends on the complete verification job;
- requires a full commit SHA supplied by the release operator;
- verifies that the supplied SHA is reachable from `main`;
- checks out and builds that exact release SHA;
- records the Git SHA and workflow run in the Actions job summary;
- builds from that exact commit;
- deploys using `wrangler.router.jsonc`;
- configures the existing owner-access Worker secret;
- serializes production deployments through the `heart-connect-production` concurrency group.

Pull-request and automatic push runs never enter the production deployment job.

## Manual release authorization

The simplified model deliberately does not use a GitHub `production` Environment. A release operator with GitHub write access must manually dispatch this workflow from `main` and provide the approved commit SHA. GitHub documents that manual workflow dispatch requires write access; by default, users with write access can trigger workflows. Therefore repository Actions/workflow-execution policy should be used if the Project Owner needs to restrict which write-capable users may perform production releases.

This is the principal security tradeoff versus a protected GitHub Environment: there is no required-reviewer gate or environment-level approval prompt in the workflow. The compensating controls are protected `main`, required CI checks, exact-SHA verification, least-privilege workflow permissions, repository-scoped production secrets, and explicit operator authorization.

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

The GitHub Actions run records the exact release SHA, workflow run ID, and production target in the job summary.

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
- receive the Project Owner's manual release authorization;
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

No production deployment is permitted unless the Project Owner explicitly authorizes the release by dispatching the production workflow from `main` with the approved release SHA.

The workflow intentionally does not create or require a GitHub `production` Environment. This keeps the release path simple while retaining protected-main and CI controls.
