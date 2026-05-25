# Tasks: ESLint Cleanup

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~40 lines |
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
| 1 | Configure overrides and refactor production files | PR 1 | Targets feature/tracker branch; includes verification |

## Phase 1: Configuration Overrides

- [x] 1.1 Modify `eslint.config.js` to add the rule override for test files disabling `@typescript-eslint/no-explicit-any` and ignoring unused vars with leading underscores.

## Phase 2: Production Code Refactoring

- [x] 2.1 Refactor `src/hooks/useAnalysisPipeline.ts` to declare `valA` and `valB` without initializing them to `null` to fix useless assignment.
- [x] 2.2 Refactor `src/services/academicLogic.ts` to typecast `subjectWeights` as structured nested records to replace `any` with safe TS syntax.
- [x] 2.3 Refactor `src/services/excelParser.ts` to change `let rawVal` to `const rawVal`.
- [x] 2.4 Refactor `src/services/reportEngine.ts` to declare `adviceText` without initialization to fix useless assignment, allowing `_config` parameter through underscore rules.
- [x] 2.5 Refactor `src/store/useDashboardStore.ts` to change `let newEstudiantes` to `const newEstudiantes`.

## Phase 3: Verification

- [x] 3.1 Execute `npm run lint` and verify exactly 0 errors and warnings.
- [x] 3.2 Execute `npm run test` and verify that all 133 tests continue to pass in green.
