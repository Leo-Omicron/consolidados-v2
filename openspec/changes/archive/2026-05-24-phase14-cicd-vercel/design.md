# Design: Deployment Blindado en Vercel (CI/CD)

## Technical Approach

Sequential GitHub Actions pipeline triggered on pushes and pull requests targeting the `master` branch. The pipeline validates code quality first (`lint`, `test`, compilation checks). On success, if the branch is `master`, it uses Vercel CLI's `--prebuilt` mechanism to fetch remote configurations, build the production assets locally inside the GHA runner (using our existing `"build": "tsc -b && vite build"` command), and push the finished artifacts directly to Vercel.

## Architecture Decisions

| Decision | Option | Tradeoff | Choice & Rationale |
|---|---|---|---|
| **Sequential Verification** | Parallel execution of lint, test, and build jobs. | Fast execution but risks deploying failing code. | **Sequential Validation**: `deploy` runs only after `validate` succeeds. Prevents broken code from reaching production. |
| **Local GHA Compilation** | Traditional remote Vercel-side build. | Simpler setup but prone to environment drift; bypasses test verification. | **Local Build & Prebuilt Deploy**: Build locally with `vercel build` inside GHA, then `vercel deploy --prebuilt`. Ensures exact tested bundle is deployed. |

## Data Flow

```
[ Push / PR to master ]
          │
          ▼
┌───────────────────────────────────────┐
│ Job: validate (ubuntu-latest)        │
│ ├─ Setup Node.js 20 & npm cache       │
│ ├─ Install: npm ci                    │
│ ├─ Lint: npm run lint                 │
│ └─ Test: npm run test                 │
└──────────────────┬────────────────────┘
                   │
                   ▼ (Success & branch == master)
┌───────────────────────────────────────┐
│ Job: deploy (ubuntu-latest)           │
│ ├─ Setup Node.js 20 & npm cache       │
│ ├─ Install: npm ci                    │
│ ├─ Pull Config: vercel pull           │
│ ├─ Build Local: vercel build --prod   │
│ └─ Deploy: vercel deploy --prebuilt  │
└───────────────────────────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `.github/workflows/ci.yml` | Create | GitHub Actions workflow defining the sequential pipeline with `validate` and `deploy` jobs. |
| `openspec/changes/phase14-cicd-vercel/design.md` | Create | Technical design artifact documenting architecture decisions and secrets config. |

## Interfaces / Contracts

### Workflow Configuration: `.github/workflows/ci.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ master ]
  pull_request:
    branches: [ master ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run Linter
        run: npm run lint

      - name: Run Tests
        run: npm run test

  deploy:
    runs-on: ubuntu-latest
    needs: validate
    if: github.ref == 'refs/heads/master'
    env:
      VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
      VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Pull Vercel Environment Info
        run: npx vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project Locally
        run: npx vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy Prebuilt Artifacts to Vercel
        run: npx vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## Secrets Configuration

To connect GHA and Vercel, the following GitHub Repository Secrets must be set under **Settings > Secrets and variables > Actions**:

1. **`VERCEL_TOKEN`**: Personal Access Token. Create at `Vercel Dashboard > Account Settings > Tokens`.
2. **`VERCEL_ORG_ID`**: Owner/Team ID. Locate in `.vercel/project.json` after running `vercel link` locally, or under Vercel Account/Team Settings.
3. **`VERCEL_PROJECT_ID`**: ID of this project. Locate in `.vercel/project.json` or under `Vercel Project > Settings > General`.

## Testing Strategy

Since GHA pipelines cannot be fully tested with standard local unit tests, we will apply the following verification protocol:

| Stage | Verification Step | Expected Outcome |
|-------|-------------------|------------------|
| **PR Trigger** | Submit a PR from a feature branch to `master`. | `validate` job runs. `deploy` job is skipped. |
| **Validation Failure** | Introduce a lint or test error in a PR. | `validate` fails. Pipeline stops immediately. |
| **Production Run** | Merge PR or push directly to `master`. | `validate` succeeds, triggering `deploy`. Vercel updates with prebuilt bundle. |

## Migration / Rollout

No data migration required. After deploying the workflow, the automatic git integration inside the Vercel project settings can be safely disabled or configured to ignore automated repository pushes to prevent double deployments.
