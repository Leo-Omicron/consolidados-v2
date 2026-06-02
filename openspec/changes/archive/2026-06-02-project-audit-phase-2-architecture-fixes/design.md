# Design: Phase 2 Architecture Fixes — Reports & Analysis Pipeline

## Technical Approach

Four independent, surgical fixes: (1) `startTransition` wrap on tab-switch to suppress fast-chunk Suspense flash; (2) single `useAnalysisPipeline` call + pure `calculateKPIs` on raw `rowsArea` for baseline comparison; (3) drop `activeTab` guard from `useMemo` deps so all 7 report datasets are available for export without recomputation; (4) `Array.some` group-existence check in `canExportConsolidadoCompleto`.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Wrap `setActiveTab` in `startTransition` vs useEffect deferred | `startTransition` is React 18 concurrent — marks update as transitional, defers Suspense but keeps tab responsive | **startTransition** — idiomatic, no extra state, no timeout hacks |
| Single pipeline + pure `calculateKPIs` vs keep dual calls | Dual call wastes 2x memo chain, pure function is zero-overhead for baseline | **Single call + pure func** — `originalKpis` computed via `augmentRows` + `calculateKPIs` from raw `rowsArea`/`rowsAsignatura`, unfiltered |
| Drop `activeTab` guard from report memos vs lazy `useCallback` in export handler | Lazy approach adds complexity; datasets are <500 students — all-report computation is negligible | **Unconditional memos** — each report uses `[estudiantes, activeGroupToUse, config]` dep array, no `activeTab` condition |
| `Array.some` inline vs precomputed `Set` | `Set` is overkill for ~10 groups, adds hook boilerplate | **Inline `some()`** — O(n) per call, n < 1000 students, called once on render |

## Data Flow

```
ReportsTab.tsx
  │
  ├─ tab click ──→ startTransition(setActiveTab(id))
  │                    │
  │                    └─→ useUIStore → Suspense boundary (deferred on fast switch)
  │
  └─ handleExportConsolidadoCompleto()
       │
       ├─ reads groupPerformanceData, outstandingStudentsData, … (all pre-memoized)
       └─ calls ExcelExportServiceImpl.exportConsolidadoCompleto({…})

AnalysisTab.tsx
  │
  ├─ useAnalysisPipeline(activeRows, …) ──→ { groupedAndSorted, kpis }   ← single call
  │
  └─ useMemo(() => {
       const raw = viewMode === 'area' ? rowsArea : rowsAsignatura;
       return calculateKPIs(augmentRows(raw, viewMode));
     }, [rowsArea, rowsAsignatura, viewMode])
     ──→ originalKpis (unfiltered baseline, no pipeline overhead)
```

## File Changes

| File | Action | Why |
|------|--------|-----|
| `src/components/dashboard/ReportsTab.tsx` | Modify | Import `startTransition`; wrap `setActiveTab(item.id)` at line 109 |
| `src/components/dashboard/ReportsTab/useReportsLogic.ts` | Modify | **(a)** Remove `activeTab` from all 7 report `useMemo` dep arrays — each memo runs whenever `[estudiantes, activeGroupToUse, config]` change. **(b)** Replace 7 inline `generate*Report()` calls in `handleExportConsolidadoCompleto` with direct references to memoized data. **(c)** Add `estudiantes.some(s => s.grupo === activeGroupToUse)` to `canExportConsolidadoCompleto` |
| `src/components/dashboard/AnalysisTab.tsx` | Modify | Remove first `useAnalysisPipeline` call (line 92-95). Import `augmentRows` + `calculateKPIs` from `useAnalysisPipeline`. Add `useMemo` computing `originalKpis` from raw `rowsArea`/`rowsAsignatura` (unfiltered). Keep single pipeline call on `activeRows` for display data |

## Interfaces / Contracts

**No new interfaces.** All changes are internal wiring. Type contracts unchanged:

- `useAnalysisPipeline` keeps signature; called once, not twice
- `AnalysisKPIs` receives same `AnalysisKPIsData` shape — `originalKpis` now computed from unfiltered rows
- `useReportsLogic` return interface unchanged — consumers (`ReportsTab`, `TeacherFeedbackView`, `OfficialRecordsView`) see same shape

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `canExportConsolidadoCompleto` returns false when group has no students | New test in `ReportsTab.test.tsx`: mock `selectedGrupo='Todos'`, set `activeGroupToUse` to non-existent group, verify `aria-disabled='true'` |
| Unit | Export handler references memoized data, not fresh generators | Wrap memo values in spy, verify `generate*Report` not called during export click |
| Integration | Single pipeline invocation in AnalysisTab | Existing test at line 126 uses `toHaveBeenLastCalledWith` — remains valid: verifies the single call arguments. Add `toHaveBeenCalledTimes(1)` assertion |
| Integration | Original KPI values match pre-refactor behavior | Snapshot `originalKpis` with known `rowsArea` input, compare against pre-refactor computed values |
| Regression | All existing tests pass | Run `npx vitest run` — existing mocks for `useAnalysisPipeline` return `{ groupedAndSorted, kpis }`; `originalKpis` is computed separately and not mocked, so existing AnalysisTab tests are unaffected |

## Open Questions

- [ ] Confirm 7 report memo recomputation on every render (dropping `activeTab` guard) is acceptable for datasets <1000 students. If profiling shows overhead, split into lazy-export-only memos.

