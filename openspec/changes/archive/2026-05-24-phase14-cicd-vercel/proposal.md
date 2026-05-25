# Proposal: Deployment Blindado en Vercel (CI/CD)

## Intent

Secure the deployment pipeline to guarantee that only code passing all Vitest tests and linting checks is built and published to the production environment on Vercel.

## Scope

### In Scope
- Create `.github/workflows/ci.yml` with sequential build, lint, and test jobs.
- Conditionally deploy using Vercel CLI `--prebuilt`.
- Configure Vercel integration secrets.
- Document GitHub secrets setup guide (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).

### Out of Scope
- Configuring non-GitHub CI platforms (e.g. CircleCI).
- Automating GitHub branch protection rules (manual task).
- Multi-environment preview setup for multiple domains.

## Capabilities

### New Capabilities
None

### Modified Capabilities
None

## Approach

Implement a sequential GitHub Actions pipeline triggered on pushes and pull requests targeting the `master` branch. The runner validates code via ESLint, Vitest, and TypeScript compiler. On the `master` branch, upon successful checks, GitHub Actions compiles the app via `npm run build` and uses Vercel CLI (`vercel deploy --prebuilt`) to deploy production assets directly, completely bypassing Vercel-side compilation.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `.github/workflows/ci.yml` | New | High-level CI/CD pipeline definition |
| `openspec/changes/phase14-cicd-vercel/proposal.md` | New | Technical change proposal |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missing GitHub secrets | Medium | Comprehensive documentation on secret configuration |
| Flaky tests | Low | Regular test suite audits and quarantine policies |

## Rollback Plan

Delete `.github/workflows/ci.yml` and re-enable automatic GitHub build hooks inside the Vercel dashboard.

## Dependencies

- GitHub Repository Admin access (for adding secrets)
- Vercel Account & CLI token

## Success Criteria

- [ ] Push to master triggers the GitHub Action.
- [ ] Action runs lint, tests, and build successfully.
- [ ] If lint or tests fail, the action halts and no Vercel deployment occurs.
- [ ] If all checks pass, prebuilt assets are successfully deployed to Vercel production.
