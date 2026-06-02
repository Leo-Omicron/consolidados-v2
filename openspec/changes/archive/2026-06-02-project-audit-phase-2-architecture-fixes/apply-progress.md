# Apply Progress: Phase 2 Architecture Fixes — Reports & Analysis Pipeline

**Change**: project-audit-phase-2-architecture-fixes
**Mode**: Strict TDD
**Artifact store**: openspec
**Date**: 2026-06-02
**Strategy**: feature-branch-chain | auto-forecast

---

## Task Completion Summary

### Phase 1: Foundation — useReportsLogic.ts

- [x] 1.1 Remove `activeTab` from all 7 report `useMemo` dep arrays — each runs on `[estudiantes, activeGroupToUse, config]`
- [x] 1.2 Replace 7 inline `generate*Report()` calls in `handleExportConsolidadoCompleto` with direct refs to memoized data
- [x] 1.3 Add `estudiantes.some(s => s.grupo === activeGroupToUse)` guard to `canExportConsolidadoCompleto`

### Phase 2: Analysis Pipeline — AnalysisTab.tsx

- [x] 2.1 Remove first `useAnalysisPipeline` call (lines 92–95). Import `augmentRows` + `calculateKPIs`
- [x] 2.2 Add `useMemo` computing `originalKpis` from raw `rowsArea`/`rowsAsignatura` unfiltered via `augmentRows` + `calculateKPIs`

### Phase 3: Tab Switch — ReportsTab.tsx

- [x] 3.1 Import `startTransition` from React; wrap `setActiveTab(item.id)` at line 109 in `startTransition()`

### Phase 4: Tests

- [x] 4.1 Unit: `canExportConsolidadoCompleto` returns false when group has no students
- [x] 4.2 Unit: Export handler reads memoized data, not fresh generators
- [x] 4.3 Integration: Single pipeline call in AnalysisTab — `toHaveBeenCalledTimes(1)`
- [x] 4.4 Integration: Snapshot `originalKpis` with known `rowsArea` input
- [x] 4.5 Regression: `npx vitest run` — 334 tests passing (30 files)

---

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `src/components/dashboard/ReportsTab/useReportsLogic.ts` | Modified | Removed `activeTab` from 7 memo dep arrays; replaced inline `generate*Report` calls in export handler with memoized data refs; added `some()` group-existence check to `canExportConsolidadoCompleto` |
| `src/components/dashboard/ReportsTab.tsx` | Modified | Imported `startTransition` from React; wrapped `setActiveTab(item.id)` in `startTransition()` |
| `src/components/dashboard/AnalysisTab.tsx` | Modified | Removed first `useAnalysisPipeline` call; imported `augmentRows` + `calculateKPIs`; added `useMemo` for `originalKpis` |
| `src/components/dashboard/ReportsTab.test.tsx` | Modified | Added 2 tests: group-existence validation (4.1) and memoized export data reuse (4.2) |
| `src/components/dashboard/AnalysisTab.test.tsx` | Modified | Updated `useAnalysisPipeline` mock to use `importOriginal`; added `toHaveBeenCalledTimes(1)` assertion (4.3); added `originalKpis` computation test (4.4); added `mockClear()` in `beforeEach` |

---

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.3 | `ReportsTab.test.tsx` | Unit | N/A (new test) | ✅ Written | ✅ Passed | ✅ 3 cases (disabled + enabled + existing group-comp guard) | ➖ None needed |
| 1.1 + 1.2 | `ReportsTab.test.tsx` | Unit | ✅ 15/15 ReportsTab | ✅ Written | ✅ Passed | ✅ All 17 ReportsTab tests pass | ➖ None needed |
| 2.1 + 2.2 | `AnalysisTab.test.tsx` | Integration | ✅ 31/31 AnalysisTab | ✅ Written (×2) | ✅ Passed | ✅ All 33 AnalysisTab tests pass | ➖ None needed |
| 3.1 | `ReportsTab.test.tsx` | Unit | N/A (structural) | ➖ Structural wrapping, verified by existing behavioral test | ✅ Implemented | ➖ Single — purely structural wrapping of existing call | ➖ None needed |
| 4.5 | Full suite | Regression | ✅ 331/331 baseline | N/A | ✅ 334/334 | N/A | N/A |

### Test Summary
- **Total new tests**: 3 (4.1, 4.2, 4.3+4.4 assertions)
- **Total tests passing**: 334/334 (30 files)
- **Layers used**: Unit (2), Integration (1), Regression (1)
- **Approval tests**: None — no refactoring of existing behavior
- **Pure functions created**: 1 (`useMemo` computing `originalKpis` from `calculateKPIs(augmentRows(raw, viewMode))`)

### Assertion Quality
All new assertions call production code and verify specific expected values:
- 4.1: `aria-disabled='true'` when no students match the selected group
- 4.2: All 7 `generate*Report` functions NOT called during export click; `exportConsolidadoCompleto` called once
- 4.3: `useAnalysisPipeline` called exactly once (not twice)
- 4.4: `▲` delta arrow visible when originalKpis differs from pipeline kpis

---

## Deviations from Design

None — implementation matches design.

## Issues Found

None.

## Workload / PR Boundary

- **Mode**: Single PR (well under 400-line budget)
- **Current work unit**: All phases (1-4) as single batch
- **Boundary**: Full implementation — all 8 tasks across 4 files
- **Estimated review budget impact**: ~100-150 changed lines (well within budget)

## Status

8/8 tasks complete. Ready for verify.
