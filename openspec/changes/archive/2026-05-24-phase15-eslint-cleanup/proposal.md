# Proposal: ESLint Cleanup

## Intent

Resolve all 97 pre-existing ESLint errors across the repository to ensure that our strict CI/CD validation pipeline passes cleanly, while preserving strict code standards in production and practical flexibility in test files.

## Scope

### In Scope
- Configure ESLint overrides in `eslint.config.js` to disable `@typescript-eslint/no-explicit-any` exclusively for test files (`**/*.test.{ts,tsx}`).
- Configure ESLint inside `eslint.config.js` to ignore unused variables that start with an underscore (`_`), e.g., `argsIgnorePattern: "^_"`.
- Fix the useless assignments and variable declarations in production files:
  - `src/hooks/useAnalysisPipeline.ts` (lines 155, 156)
  - `src/services/academicLogic.ts` (lines 163, 164)
  - `src/services/excelParser.ts` (line 92)
  - `src/services/reportEngine.ts` (lines 134, 187, 261, 329, 415, 435)
  - `src/store/useDashboardStore.ts` (lines 54, 74)

### Out of Scope
- Rewriting all test files to completely eliminate `any` casts (which would be extremely verbose and offer no architectural value).
- Modifying non-linter related TypeScript configurations or rules.

## Capabilities

### New Capabilities
None

### Modified Capabilities
None

## Approach

Adjust rule sets in `eslint.config.js` to apply appropriate test file exceptions and underscore exceptions, and perform surgical refactoring of variable declarations in production files.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `eslint.config.js` | Modified | Add overrides for test files and unused underscore variables |
| `src/hooks/useAnalysisPipeline.ts` | Modified | Remove useless initializations of `valA` and `valB` |
| `src/services/academicLogic.ts` | Modified | Resolve `@typescript-eslint/no-explicit-any` errors |
| `src/services/excelParser.ts` | Modified | Resolve `prefer-const` warning on `rawVal` |
| `src/services/reportEngine.ts` | Modified | Remove unused variable and useless initialization |
| `src/store/useDashboardStore.ts` | Modified | Resolve `prefer-const` warnings on `newEstudiantes` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Code behavior changes from refactoring | Low | Run the comprehensive 133-test Vitest suite, ensuring 100% pass rate after changes |

## Rollback Plan

Run `git checkout -- .` to discard any changes in the repository and restore the original code state.

## Dependencies

None

## Success Criteria

- [ ] `npm run lint` executes with exactly 0 errors or warnings.
- [ ] `npm run test` executes with all 133 tests passing.
