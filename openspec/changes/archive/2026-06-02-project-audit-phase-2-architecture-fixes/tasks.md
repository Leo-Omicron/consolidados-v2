# Tasks: Phase 2 Architecture Fixes — Reports & Analysis Pipeline

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 100–180 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR (or 3 micro-PRs for feature-branch-chain) |
| Delivery strategy | auto-forecast |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: feature-branch-chain
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Reports & export fixes (useReportsLogic.ts) | PR 1 | Base = `feat/audit-phase-2-arch-fixes` tracker branch |
| 2 | Analysis pipeline fix (AnalysisTab.tsx) | PR 2 | Base = PR 1 branch; tests included |
| 3 | Tab switch Suspense fix (ReportsTab.tsx) | PR 3 | Base = PR 2 branch; tests included |

## Phase 1: Foundation — useReportsLogic.ts

- [x] 1.1 Remove `activeTab` from all 7 report `useMemo` dep arrays — each runs on `[estudiantes, activeGroupToUse, config]`
- [x] 1.2 Replace 7 inline `generate*Report()` calls in `handleExportConsolidadoCompleto` with direct refs to memoized data
- [x] 1.3 Add `estudiantes.some(s => s.grupo === activeGroupToUse)` guard to `canExportConsolidadoCompleto`

## Phase 2: Analysis Pipeline — AnalysisTab.tsx

- [x] 2.1 Remove first `useAnalysisPipeline` call (lines 92–95). Import `augmentRows` + `calculateKPIs`
- [x] 2.2 Add `useMemo` computing `originalKpis` from raw `rowsArea`/`rowsAsignatura` unfiltered via `augmentRows` + `calculateKPIs`

## Phase 3: Tab Switch — ReportsTab.tsx

- [x] 3.1 Import `startTransition` from React; wrap `setActiveTab(item.id)` at line 109 in `startTransition()`

## Phase 4: Tests

- [x] 4.1 Unit: `canExportConsolidadoCompleto` returns false when group has no students — mock `selectedGrupo='Todos'`, verify `aria-disabled='true'`
- [x] 4.2 Unit: Export handler reads memoized data, not fresh generators — spy memo values, verify `generate*Report` not called on export click
- [x] 4.3 Integration: Single pipeline call in AnalysisTab — add `toHaveBeenCalledTimes(1)` assertion to existing test (line 126)
- [x] 4.4 Integration: Snapshot `originalKpis` with known `rowsArea` input, compare against pre-refactor computed values
- [x] 4.5 Regression: Run `npx vitest run` — confirm all existing tests pass
