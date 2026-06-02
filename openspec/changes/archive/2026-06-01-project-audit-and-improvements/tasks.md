# Tasks: Critical Bugs & Technical Debt Remediation

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1100-1200 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | auto-forecast |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation + UI replacements + useEffect removal | PR 1 | base=feature/tracker; ~110 lines |
| 2 | AnalysisTab decomposition (4 sub-components) | PR 2 | base=PR#1; ~900 lines (mechanical extraction) |
| 3 | IndexedDB fix + config + all testing | PR 3 | base=PR#2; ~195 lines |

## Phase 1: Foundation

- [x] 1.1 Import `PASSING_GRADE` in `reportEngine.ts`; replace 7 hardcoded `3.0` comparisons
- [x] 1.2 Replace inline period detection in `useReportsLogic.ts` with `getEvaluatedPeriods()`

## Phase 2: UI Constant Replacements

- [x] 2.1 Replace hardcoded `3.0` in `SummaryTab.tsx` (chart threshold, label, KPI, status thresholds)
- [x] 2.2 Replace hardcoded `3.0` in `HeatmapTab.tsx` (color fn, label, title, failingCount)
- [x] 2.3 Replace hardcoded `3.0` in `BattleTab.tsx`, `OfficialRecordsView.tsx`, `GroupComparisonView.tsx`
- [x] 2.4 Replace hardcoded `3.0` in `VolatilityTab.tsx` and `TutorsTab.tsx`

## Phase 3: useEffect Removal

- [x] 3.1 Remove `useEffect` in `VolatilityTab.tsx`; replace inline period with `getEvaluatedPeriods()`
- [x] 3.2 Remove `useEffect` in `TutorsTab.tsx`; verify `activeGroup` derived correctly

## Phase 4: AnalysisTab Decomposition

- [x] 4.1 Extract lines 161-192 → `AnalysisTab/SimulationBanner.tsx` with `SimulationBannerProps`
- [x] 4.2 Extract lines 215-255 → `AnalysisTab/SubjectWeightsPanel.tsx` with `SubjectWeightsPanelProps`
- [x] 4.3 Extract lines 258-305 → `AnalysisTab/FiltersBar.tsx` with `FiltersBarProps`
- [x] 4.4 Extract lines 317-645 → `AnalysisTab/StudentGroupTable.tsx` with `StudentGroupTableProps`
- [x] 4.5 Rewrite `AnalysisTab.tsx` as orchestrator composing the 4 sub-components (~180 lines)

## Phase 5: IndexedDB Fix

- [x] 5.1 Remove `estudiantes` from `partialize` in `useDashboardStore.ts`; simplify `merge`

## Phase 6: Testing + Verification

- [x] 6.1 Write RTL test: VolatilityTab renders without `setGrupo` on mount
- [x] 6.2 Write RTL test: TutorsTab renders without global mutation
- [x] 6.3 Write RTL test: AnalysisTab composes sub-components correctly
- [x] 6.4 Integration test: processFiles → reload → verify derived data restored
- [x] 6.5 Run `npx vitest run` after each PR — all 316+ tests pass (331/331)

## Phase 7: Cleanup

- [x] 7.1 Grep for remaining `3.0` in production files; verify all intentional (0 matches)
- [x] 7.2 Create `openspec/config.yaml` with project metadata and SDD defaults
