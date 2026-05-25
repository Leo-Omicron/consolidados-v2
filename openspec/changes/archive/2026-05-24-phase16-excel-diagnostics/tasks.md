# Tasks: Excel Diagnostics & Tolerance

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~250 - 350 lines |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full implementation of pre-parsing validation layer, Zustand store wiring, premium UI accordion, and verification tests. | PR 1 | Base branch: main. All unit and UI tests included. |

## Phase 1: Foundation

- [x] 1.1 Export `DiagnosticSeverity`, `DiagnosticIssue`, and `DiagnosticReport` interfaces in `src/services/excelParser.ts` as per the design document.
- [x] 1.2 Implement pure helper function `getColumnLetter(colIndex: number): string` in `src/services/excelParser.ts` to convert 0-indexed column numbers to Excel column letters.

## Phase 2: Logic Validation (Strict TDD)

- [x] 2.1 Write failing tests (RED) in `src/services/excelParser.test.ts` for `getColumnLetter` boundary values (0 to 702) and `validateWorkbook` matching all design rule scenarios.
- [x] 2.2 Implement pure function `validateWorkbook(workbook: XLSX.WorkBook): DiagnosticReport` in `src/services/excelParser.ts` to make all unit tests pass (GREEN).
- [x] 2.3 Refactor (REFACTOR) validation and helper routines in `src/services/excelParser.ts` ensuring clean code and 100% logic coverage.

## Phase 3: Store Wiring

- [x] 3.1 Extend `DashboardState` with state field `diagnosticReport: DiagnosticReport | null` and reset action in `src/store/useDashboardStore.ts`.
- [x] 3.2 Update `processFile` in `src/store/useDashboardStore.ts` to execute `validateWorkbook` first, save the report, and block file processing throwing an error if any critical issues exist.
- [x] 3.3 Add unit/integration tests in `src/store/useDashboardStore.test.ts` to verify critical-blocking and non-critical reporting logic.

## Phase 4: UI Presentation

- [x] 4.1 Update `FileUploadArea.tsx` to retrieve `diagnosticReport` from store and conditionally render a premium, expandable accordion for warning and suggestion items using Tailwind v4 styles.
- [x] 4.2 Update `FileUploadArea.test.tsx` to mount, trigger drop, mock state with issues, and verify that the accordion items display sheet, row, and letter coordinates properly.

## Phase 5: Verification

- [x] 5.1 Execute `npm run test` to verify that 100% of parser, store, and UI unit tests pass successfully.
- [x] 5.2 Run lint check to ensure zero ESLint errors across modified files.
