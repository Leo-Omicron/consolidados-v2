# Proposal: Phase 2 Architecture Fixes — Reports & Analysis Pipeline

## Intent

Fix four performance and correctness defects in `ReportsTab` and `AnalysisTab` discovered during architecture audit (#570, #576): unnecessary Suspense flash on tab switches, double pipeline computation in AnalysisTab, redundant export recomputation, and missing group-existence validation on "Consolidado Completo" export.

## Scope

### In Scope
- Add `startTransition` wrapping to tab-switch handler in `ReportsTab.tsx`
- Deduplicate pipeline calls in `AnalysisTab.tsx` (reuse single `useAnalysisPipeline` call for both KPI comparison and grouped display)
- Reuse memoized report data in `handleExportConsolidadoCompleto` instead of recomputing 7 generators
- Validate group existence in `canExportConsolidadoCompleto` via `estudiantes.some(s => s.grupo === activeGroupToUse)`

### Out of Scope
- `structuredClone` removal in simulation logic (accepted as-is)
- Per-view granular Suspense boundaries (deferred)
- Decoupling `TeacherFeedbackView`/`OfficialRecordsView` from `logic` prop (deferred)
- `useReportsLogic` return-value stabilization via `useMemo` (deferred)
- Array allocation optimization in `sortGroups`/`augmentRows` (negligible for dataset sizes)

## Capabilities

### New Capabilities
None — pure implementation fixes; no new spec-level behavior.

### Modified Capabilities
None — no existing spec requirements change. Bug fix on `canExportConsolidadoCompleto` addresses incorrect gating, not changed requirements.

## Approach

**Fix 1 — `startTransition`**: Import `startTransition` from React in `ReportsTab.tsx`. Wrap `setActiveTab(item.id)` callback (line 109) so React defers Suspense fallback display on fast tab switches.

**Fix 2 — Pipeline dedup**: Rewrite `AnalysisTab.tsx` lines 92-104. Replace both `useAnalysisPipeline` calls with a single call using `activeRows` as input; compute `originalKpis` by applying KPI-calculation functions directly to `rowsArea` (unfiltered, no pipeline overhead). Avoids 2× memo chain evaluation per render.

**Fix 3 — Reuse memoized data**: In `handleExportConsolidadoCompleto` (lines 166-184 of `useReportsLogic.ts`), replace the 7 `generate*Report()` calls with direct references to already-computed `groupPerformanceData`, `outstandingStudentsData`, etc. Saves 6/7 generators per export. `groupComparisonReport` is already excluded by the `activeTab !== 'group-comparison'` guard.

**Fix 4 — Group existence validation**: Add `estudiantes.some(s => s.grupo === activeGroupToUse)` to the `canExportConsolidadoCompleto` boolean expression (line 106). The current check only validates `activeGroupToUse` is truthy — it doesn't verify students actually belong to that group.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/dashboard/ReportsTab.tsx` | Modified | Add `startTransition` import; wrap `setActiveTab` |
| `src/components/dashboard/ReportsTab/useReportsLogic.ts` | Modified | Fix 3 + Fix 4: reuse memoized data; add group-existence check |
| `src/components/dashboard/AnalysisTab.tsx` | Modified | Fix 2: consolidate dual pipeline calls into single hook call + inline KPI computation for originals |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Pipeline dedup changes KPI comparison behavior | Low | `originalKpis` must compute from unfiltered `rowsArea`, not `currentRowsArea`. Keep filters/sort active on grouped data only. |
| Memoized export data stale if deps not updated | Low | Handler executes synchronously after render with same `config`/`activeGroupToUse` — memo deps match export deps. |

## Rollback Plan

Each fix is independent and reversible via `git revert` on its commit. `startTransition` can be removed without side effects. Pipeline dedup preserves the original hook signature — rollback restores the second call. Memoized export rollback restores explicit `generate*Report()` calls. Validation check is additive — remove the `some()` call to revert.

## Dependencies

None. All fixes use existing APIs and data already in component scope.

## Success Criteria

- [ ] Tab switches in ReportsTab show no Suspense fallback for fast (<200ms) chunk loads
- [ ] AnalysisTab renders with a single `useAnalysisPipeline` invocation (verify via React DevTools profiler)
- [ ] "Consolidado Completo" button disabled when `activeGroupToUse` has no matching students
- [ ] `handleExportConsolidadoCompleto` calls exactly 0 redundant `generate*Report` functions (spot-check via breakpoint or `console.count`)
- [ ] All existing `vitest` tests pass (run `npx vitest run`)
