# Tasks: Deployment Blindado en Vercel (CI/CD)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~60 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | auto-forecast |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: feature-branch-chain
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Create validation & deployment workflow | Single PR | Includes secrets setup guide |

## Phase 1: Foundation / Infrastructure

- [x] 1.1 Verify package.json scripts (`npm run lint`, `npm run test`) and lockfile to ensure tests/linter run correctly.
- [x] 1.2 Check for any pre-existing `.github/workflows` directory and prepare it.

## Phase 2: Workflow Setup

- [x] 2.1 Create `.github/workflows/ci.yml` defining sequential validation (`lint`, `test`) and Vercel `--prebuilt` deployment jobs.

## Phase 3: Setup Guide / Documentation

- [x] 3.1 Create `openspec/changes/phase14-cicd-vercel/secrets-guide.md` detailing Vercel token, org, and project secret setup.

## Phase 4: Verification (Dry Run)

- [x] 4.1 Run static analysis/syntax audit on `.github/workflows/ci.yml` (e.g., yaml-lint or dry-run validation).
- [x] 4.2 Document and present manual verification steps for testing the CI/CD pipeline on the live GitHub repository.
