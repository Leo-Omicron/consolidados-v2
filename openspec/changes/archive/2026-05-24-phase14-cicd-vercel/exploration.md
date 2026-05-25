## Exploration: Phase 14 CI/CD Vercel (Deployment Blindado)

### Current State
Currently, the repository is a modern React 19 + TypeScript + Vite project with no existing CI/CD or deployment configuration. There is no `.github` directory or workflows defined.
Key structural components:
1. **Scripts in `package.json`**:
   - `"build": "tsc -b && vite build"`: Compiles TypeScript using project references (incremental mode) and compiles the assets via Vite.
   - `"lint": "eslint ."`: Runs ESLint. It utilizes Flat Config (`eslint.config.js`).
   - `"test": "vitest run"`: Runs Vitest in single-run (CI-compatible) mode.
2. **Linting Configuration**:
   - `eslint.config.js`: Built with the new ESLint Flat Config style, using `defineConfig` and ignoring `dist`. This ensures full TypeScript and React hook compliance.
3. **Vite & Vitest Configuration**:
   - `vite.config.ts`: Configures Vite with `@vitejs/plugin-react` and `@tailwindcss/vite`. It also declares the test environment as `jsdom` with `globals: true`, fully ready for React Testing Library.
4. **TypeScript Configuration**:
   - `tsconfig.json` references separate app and node configurations (`tsconfig.app.json` and `tsconfig.node.json`), enabling strict compilation checks.
5. **Git Branching**:
   - The repository uses `master` as its main production branch.

### Affected Areas
- `.github/workflows/ci.yml` (New) — Workflow definition for compiling, linting, testing, and deploying.
- `openspec/changes/phase14-cicd-vercel/exploration.md` (New) — This exploration file.

---

### Approaches for CI/CD and Vercel Integration

We have two primary options for integrating GitHub Actions with Vercel to guarantee a "blindado" (fully shielded/armored) production pipeline.

#### 1. Native Vercel GitHub App Integration + Strict GitHub Branch Protection
This approach leverages Vercel's native GitHub App to trigger deployments. The shielding is enforced strictly at the Git/GitHub level rather than the CI build runner.
- **Workflow**:
  1. A developer pushes code or opens a Pull Request targeting `master`.
  2. GitHub Actions immediately runs the `ci.yml` workflow (lint, test, build).
  3. In parallel, the Vercel GitHub App builds a preview deployment.
  4. **Strict Enforcement**: Under GitHub Repository Settings, `master` is configured with strict branch protection rules or a repository ruleset:
     - Require a pull request before merging (no direct pushes to `master` allowed).
     - Require status checks to pass before merging: selecting our GitHub Action job (e.g., `build-and-test`).
  5. The PR can only be merged into `master` after the GitHub Action succeeds.
  6. Upon merging to `master`, Vercel automatically deploys the production build.
- **Pros**:
  - **Zero YAML complexity** for deployment. No need to manage Vercel CLI secrets, tokens, or complex YAML jobs.
  - Vercel automatically creates preview URLs and comments on Pull Requests out-of-the-box.
  - Faster pipeline feedback as lint/tests run in parallel with the preview build.
  - Save GitHub Action minutes since Vercel builds on its own infrastructure.
- **Cons**:
  - On PRs, Vercel builds the preview deployment *before* or *during* the GitHub Action run. If tests fail, the preview deployment still exists on Vercel (though it won't be merged to production).
  - If direct pushes to `master` are not blocked, a broken push would immediately go to production on Vercel without waiting for GitHub Actions to complete.

#### 2. Fully Decoupled Deployment via GitHub Actions and Vercel CLI (`--prebuilt`)
This approach bypasses Vercel's automatic Git deployments entirely. GitHub Actions manages the sequence sequentially, compiling on the runner and uploading only if every step succeeds.
- **Workflow**:
  1. A push or PR triggers GitHub Actions.
  2. The runner executes the pipeline sequentially: `Checkout -> Setup Node -> npm ci -> npm run lint -> npm run test -> npm run build`.
  3. **Verification**: If linting or testing fails, the job immediately terminates and nothing is sent to Vercel.
  4. **Deterministic Deployment**: If and only if the checks pass, the runner uses the Vercel CLI to deploy:
     - For PRs: Pulls settings, builds, and deploys as a preview:
       `npx vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}`
       `npx vercel build --token=${{ secrets.VERCEL_TOKEN }}`
       `npx vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}`
     - For `master`: Pulls settings, builds, and deploys to production:
       `npx vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}`
       `npx vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}`
       `npx vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}`
- **Pros**:
  - **Absolute Bulletproof Security**: Not a single line of code is sent to Vercel (neither preview nor production) unless it is proven 100% bug-free, lint-passed, and fully compiled.
  - **Environment Consistency**: By using `--prebuilt`, the exact same build compiled and validated on the GitHub Actions runner is uploaded directly to Vercel. No differences in dependencies or node versions between environments.
  - Direct pushes to `master` are also protected; the action runs first and deploys only on success.
- **Cons**:
  - **Setup Complexity**: Requires generating a Vercel personal access token and finding `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` to store as GitHub repository secrets.
  - **PR Comment Boilerplate**: Generating nice PR comments with Vercel preview links requires manual YAML step configuration using GitHub Actions APIs or third-party community actions.
  - Consumes more GitHub Action runner minutes.

| Criteria | Option 1: Native App + Branch Protection | Option 2: GitHub Actions + Vercel CLI (`--prebuilt`) |
|---|---|---|
| **Security / "Blindaje"** | High (enforced via Git rules & block direct pushes) | **Absolute (strict linear CI sequence)** |
| **Setup Effort** | **Very Low (GUI click-and-select)** | Medium/High (Secrets, Vercel CLI YAML steps) |
| **Preview Experience** | **Perfect (Automatic comments/links)** | Custom (Requires manual scripts/PR actions) |
| **Build Integrity** | High (Vercel builds on push) | **Highest (Builds on GitHub and uploads prebuilt)** |
| **Resource Cost** | Low (Saves GHA runtime) | High (GHA minutes used for full builds & CLI) |

---

### Recommendation

For a truly **"Deployment Blindado" (armored deployment)** architecture, we recommend **Option 2 (GitHub Actions with Vercel CLI using `--prebuilt`)** as the primary engineering solution. It establishes a deterministic, unidirectional pipeline where code only moves forward once validated.

However, to provide the team with the most practical, developer-friendly workflow, we can design the CI/CD file to support **Option 2**'s structure while acknowledging that **Option 1** is a viable alternative if they wish to keep Vercel's automatic PR preview comments without extra setup, provided strict branch protection is configured.

#### Recommended GitHub Actions Workflow Design (`.github/workflows/ci.yml`):
```yaml
name: CI/CD Pipeline

on:
  push:
    branches:
      - master
  pull_request:
    branches:
      - master

jobs:
  validate-and-deploy:
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

      - name: Build Application
        run: npm run build

      # Optional Deployment Step if using Vercel CLI (Option 2)
      # - name: Deploy to Vercel
      #   if: success()
      #   env:
      #     VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
      #     VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
      #     VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
      #   run: |
      #     if [ "${{ github.event_name }}" = "push" ] && [ "${{ github.ref }}" = "refs/heads/master" ]; then
      #       npx vercel pull --yes --environment=production --token=$VERCEL_TOKEN
      #       npx vercel build --prod --token=$VERCEL_TOKEN
      #       npx vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN
      #     else
      #       npx vercel pull --yes --environment=preview --token=$VERCEL_TOKEN
      #       npx vercel build --token=$VERCEL_TOKEN
      #       npx vercel deploy --prebuilt --token=$VERCEL_TOKEN
      #     fi
```

### Risks
- **Secrets Management**: If Option 2 is chosen, the team must remember to configure `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` in GitHub Secrets. Without these, the deploy step will crash.
- **Flaky Tests**: Because the build is "blindado", if any Vitest unit tests are flaky, the entire production/preview deployment will be blocked. This is a design feature (ensuring quality), but requires highly robust tests.
- **Direct Pushes to Master**: If Option 1 is chosen and developers are allowed to push directly to `master` without a PR, Vercel will deploy immediately, completely bypassing the CI action and rendering the "blindaje" useless. Branch protection MUST be active to block direct pushes.

### Ready for Proposal
Yes. The requirements, structure, and options have been thoroughly researched and mapped to the existing project codebase. We are ready to propose the implementation.
