## Exploration: Architecture Audit Phase 2 — Technical Debt in Reports, Analysis Pipeline, and Lazy Loading

### Current State

Three technical debt areas were identified from discoveries #570 and #576. All three have been partially addressed by recent audit commits (`4071815` / `f2f0d49`) but residual issues remain.

---

### Issue 1: `useAnalysisPipeline` — Purity & Clone Overhead

**What was fixed:**
- **Implicit store access removed**: `useAnalysisPipeline` previously read `useDashboardStore(state => state.rowsArea)` internally (commit `4071815`). Now it receives `rowsArea` as an explicit parameter — ✅ pure.
- **Mutable sort fixed**: `group.rows.sort(...)` was an in-place mutation of the memoized group. Fixed to `group.rows = [...group.rows].sort(...)` — ✅ immutable.

**What still remains:**

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1a | **Double pipeline invocation**: `AnalysisTab.tsx` calls `useAnalysisPipeline` twice — once for "original" KPIs (line 92), once for "active/simulated" data (line 97). Both compute the full pipeline on the same large dataset. | `src/components/dashboard/AnalysisTab.tsx:92-104` | 2× computation for every filter/group/sort change. On a 500-student, 6-area dataset this means 2× memo chain evaluations. |
| 1b | **`structuredClone(estudiantes)` in simulation**: `getSimulatedRows()` deep-clones the entire `estudiante[]` tree — each student has `areas: Record<string, Area>` where each `Area` contains `asignaturas: Record<string, Asignatura>` + `DEF` + `areaStats`. Clone happens on EVERY change to `estudiantes`, `activeSimulations`, `config`, or `subjectWeights`. | `src/services/simulationLogic.ts:16` | Deep clone of 3MB+ object tree on every simulation input change. Causes GC pressure on rapid edits. |
| 1c | **Unnecessary array allocation in `sortGroups`**: `[...grouped]` creates a new array, then `.map(g => ({...g, rows: [...g.rows].sort(...)}))` creates a new object + new sorted array per group — even when sort config hasn't meaningfully changed. | `src/hooks/useAnalysisPipeline.ts:154-199` | Each pipeline evaluation allocates N+1 arrays (N = groups) + N objects. Accumulates in render-heavy scenarios. |
| 1d | **`augmentRows` creates new row objects**: For every row in the dataset, `{...row, tendencia}` creates a new object. No structural sharing with previous render. | `src/hooks/useAnalysisPipeline.ts:23-46` | Memory churn proportional to dataset size on every memo recomputation. |

**Effect on ReportsTab**: `useReportsLogic` reads `estudiantes` (the full tree) from Zustand. Any store change to `estudiantes` triggers re-computation of the active tab's report generator, which then filters and processes the full array. While `useMemo` gating prevents recomputation of inactive tabs, the active tab's report function iterates the filtered student list.

---

### Issue 2: `Suspense` in `ReportsTab.tsx` — Lazy Loading Gaps

**What was fixed:**
- All 8 subcomponents were converted from static imports to `React.lazy()` with dynamic `import()` (commit `f2f0d49`) — ✅ code-splitting active.
- View components no longer receive the full `logic` object (except `TeacherFeedbackView` and `OfficialRecordsView`), only `data` — ✅ reduced coupling for 6/8 views.

**What still remains:**

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 2a | **No `startTransition`**: Tab switches are not wrapped in `startTransition` or `useTransition`. React Suspense shows "Cargando reporte..." fallback on every tab switch while the lazy chunk loads. | `src/components/dashboard/ReportsTab.tsx:106` (sidebar button uses `setActiveTab` directly) | Perceptible flash on every tab switch. View components average ~70 lines — tiny bundles that load fast but still trigger the fallback. |
| 2b | **Single Suspense boundary**: All 8 views share one `<Suspense>` wrapper. A slow-loading chunk or an error in one view takes down the entire content area. No granular loading/error states per tab. | `src/components/dashboard/ReportsTab.tsx:150-159` | Poor error isolation; no per-view skeleton/loading state. |
| 2c | **Two views still tightly coupled to `logic`**: `TeacherFeedbackView` and `OfficialRecordsView` receive the full `useReportsLogic` return value as a `logic` prop, not just `data`. This means they can call any function or read any state from the hook, bypassing the data-only contract. | `src/components/dashboard/ReportsTab.tsx:157-158` | Breaks the data-flow isolation pattern. Makes those views harder to test and more coupled to ReportsTab lifecycle. |
| 2d | **`useReportsLogic` runs unconditionally**: The hook reads `estudiantes`, `config`, `selectedGrupo`, `availableGroups` from Zustand. Any store update to these triggers a `ReportsTab` re-render, which re-evaluates all `useMemo` gating conditions. | `src/components/dashboard/ReportsTab/useReportsLogic.ts:19-22` | Re-render cascade on unrelated store changes. The hook's return value is a new object every render, causing all child views to re-render even if their `data` prop reference is stable (most aren't because `useMemo` produces new objects). |
| 2e | **Over-splitting**: View components average ~70 lines each. The overhead of 8 separate lazy chunks (HTTP requests, parsing, evaluation) vs. one combined chunk may not be worthwhile for such tiny components. | All files in `src/components/dashboard/ReportsTab/views/` | 7 extra HTTP round-trips on first visit. Could be 2-3 logical groups instead of 8 individual chunks. |

---

### Issue 3: "Consolidado Completo" Export Button — Disabled State Bug

**What was fixed:**
- `canExportConsolidadoCompleto` was introduced in commit `4071815`, replacing the buggy inline condition.
- The **original bug** (from discovery #576): the button was gated on `!logic.groupPerformanceData`, which is only non-null when `activeTab === 'group-performance'`. This disabled the "Consolidado Completo" export on all other tabs.
- ✅ Current `canExportConsolidadoCompleto` correctly checks `activeTab !== 'group-comparison' && estudiantes.length > 0 && activeGroupToUse` — no longer depends on `groupPerformanceData`.
- ✅ Uses `aria-disabled` + `e.preventDefault()` instead of HTML `disabled` (accessibility fix from `f2f0d49`).

**What still remains:**

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 3a | **No data existence check**: `canExportConsolidadoCompleto` enables the button when `activeGroupToUse` is a truthy string, but doesn't verify that actual students belong to that group. If `activeGroupToUse` doesn't match any student's `grupo`, the export generates all-empty reports. | `src/components/dashboard/ReportsTab/useReportsLogic.ts:106-110` | User can trigger a useless export with no feedback. |
| 3b | **Redundant computation in `handleExportConsolidadoCompleto`**: The handler re-generates ALL 7 reports from scratch (lines 166-172), even though 6 of them were potentially just computed in the memoized data. The memoized data is available as `groupPerformanceData`, `outstandingStudentsData`, etc. — but the handler ignores them and recomputes everything. | `src/components/dashboard/ReportsTab/useReportsLogic.ts:158-184` | 7× report generation cost on every Consolidado Completo export, instead of reusing 6 already-memoized values. |
| 3c | **Hardcoded "7 reportes" in button title**: The tooltip says "Descarga los 7 reportes" — a magic number that could become stale if report categories change. | `src/components/dashboard/ReportsTab.tsx:87` | Stale UX copy if report count changes. |

---

### Affected Areas

| File | Role |
|------|------|
| `src/hooks/useAnalysisPipeline.ts` | Pure pipeline — clone overhead in `sortGroups`, `augmentRows` |
| `src/hooks/useAnalysisPipeline.test.ts` | Tests need update if pipeline signature changes |
| `src/services/simulationLogic.ts` | Deep clone of `estudiantes` on every simulation input change |
| `src/components/dashboard/AnalysisTab.tsx` | Double pipeline call (original + simulated) |
| `src/components/dashboard/ReportsTab.tsx` | Suspense boundary, lazy imports, button styling |
| `src/components/dashboard/ReportsTab/useReportsLogic.ts` | `canExportConsolidadoCompleto` condition, redundant export computation |
| `src/components/dashboard/ReportsTab/views/GroupPerformanceView.tsx` | Small view (~77 lines) — over-split |
| `src/components/dashboard/ReportsTab/views/TeacherFeedbackView.tsx` | Still receives `logic` prop (tight coupling) |
| `src/components/dashboard/ReportsTab/views/OfficialRecordsView.tsx` | Still receives `logic` prop (tight coupling) |
| `src/components/dashboard/SummaryTab.tsx` | Also calls `useAnalysisPipeline` |
| `src/components/dashboard/BattleTab.tsx` | Also calls `useAnalysisPipeline` (twice, for group A and B) |

---

### Approaches

#### Issue 1 — Clone Reduction in Analysis Pipeline

**1a. Deduplicate pipeline calls in AnalysisTab**

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| Compute original KPIs from the same pipeline call (add `originalRowsArea` as a separate step) | Single pipeline evaluation; cleaner data flow | May need to refactor return shape or add optional second parameter | Low |
| **RECOMMENDED: Extract `calculateFailedAreasMap` + `calculateKPIs` calls outside the pipeline for the "original" comparison** | Minimal refactor; `kpis` is already a pure function applied to `filteredRows` | Slightly less elegant than a single hook call | Low |

**1b. Avoid deep clone in simulation for unchanged cases**

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| Keep `structuredClone` but wrap in a deeper equality check before cloning | Avoids clone when simulations don't meaningfully change data | `structuredClone` is fast compared to custom deep equality — may not be worth it | Medium |
| **RECOMMENDED: Accept as-is for now** — `structuredClone` is optimized in modern V8/Chromium. The real perf gain is in pipeline deduplication (1a) | No code change | Clone cost remains | None |

**1c. Reduce array allocation in `sortGroups`**

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| Add `prevSortConfig` comparison via `useRef` to skip sort if config unchanged | Skip unnecessary allocations | Adds `useRef` complexity; minor benefit | Low |
| **RECOMMENDED: Accept as-is** — array spread + map on typical datasets (hundreds of rows) is negligible | Zero code change | Not optimal but not a bottleneck | None |

**1d. Structural sharing in `augmentRows`**

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **RECOMMENDED: Accept as-is** — `{...row, tendencia}` is standard immutable pattern. The real perf issue is the 2× pipeline call, not this. | No code change | None | None |

#### Issue 2 — Suspense & Lazy Loading Improvements

**2a. Add `startTransition` for tab switching**

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| Wrap `setActiveTab(item.id)` in `startTransition()` | Avoids Suspense fallback on fast tab switches; smooth UX | Requires React 18+ (already in use) | Low |
| **RECOMMENDED: Use `startTransition`** | Simple change, high UX improvement | None | Low |

**2b. Granular Suspense boundaries and error boundaries**

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **RECOMMENDED: Wrap each view condition in its own `<Suspense>` with per-view fallback** | Isolated error/loading states | More JSX | Low |
| Add React ErrorBoundary per view | Error isolation for crash resilience | Additional component | Medium |

**2c. Decouple remaining views from `logic` prop**

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **RECOMMENDED: Pass only the specific props each view needs (`data`, `activeGroupToUse`, `periodName`, `setPeriodName`, etc.)** | Complete data-flow isolation; views become testable with just props | More props in JSX; more `useReportsLogic` return values exposed | Medium |
| Lift interactive state (period name, director name) into a shared context or separate hook | Cleaner; avoids prop drilling | More architectural change | High |

**2d. Stabilize `useReportsLogic` return value**

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **RECOMMENDED: Wrap return object in `useMemo`** | Stable reference prevents unnecessary child re-renders | Need to list all return values as deps | Low |
| Split into two hooks: one for stable read data, one for actions | Cleaner separation; only data hook triggers re-renders | Breaking change for all consumers | Medium |

**2e. Reconsider over-splitting of lazy chunks**

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **RECOMMENDED: Keep current 8-way split** — individual chunks are <5KB each, HTTP/2 multiplexing makes this negligible. The trade-off is not meaningful. | No change | None | None |
| Merge into 2-3 logical groups (e.g., "metrics", "detail", "official") | Fewer HTTP requests | More complex grouping; subjective categorization | Medium |

#### Issue 3 — Export Button State & Logic

**3a. Validate group existence in `canExportConsolidadoCompleto`**

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **RECOMMENDED: Add `estudiantes.some(s => s.grupo === activeGroupToUse)` check** | Prevents empty export | Slightly more computation per render | Low |
| Move validation to the handler and alert the user | Less render-time cost | User only finds out on click | Low |

**3b. Reuse memoized data in `handleExportConsolidadoCompleto`**

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **RECOMMENDED: Reference the already-computed `const` values instead of calling generators again** | 6/7 report computations are saved | Risk of stale data if memo deps haven't updated — mitigated because handler reads same `config`/`activeGroupToUse` that memos depend on | Low |
| Export all 7 fresh (current approach) | Guarantees fresh data | Unnecessary recomputation | None — keep as-is if freshness is preferred |

**3c. Derive tooltip count from `menuItems` length**

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **RECOMMENDED: Derive from `menuItems.filter(...)` to get actual exportable report count** | Self-documenting; no magic number | Minor indirection | Low |

---

### Recommendation

**Highest impact (least effort):**

1. **Add `startTransition` to tab switching in `ReportsTab.tsx`** — 1 import, 1 wrapper, eliminates Suspense flash for all tabs. Single biggest UX improvement.
2. **Deduplicate pipeline calls in `AnalysisTab.tsx`** — reduces computation by ~50% for the analysis pipeline on every interaction.
3. **Reuse memoized data in `handleExportConsolidadoCompleto`** — reference `groupPerformanceData`, `outstandingStudentsData`, etc. instead of calling `generate*Report` again. 6/7 report generators saved per export click.
4. **Add group-existence check to `canExportConsolidadoCompleto`** — prevents useless export with no data.

**Medium effort, good outcome:**

5. **Wrap `useReportsLogic` return value in `useMemo`** — prevents child re-render cascades.
6. **Granular Suspense boundaries per view** — isolates loading/error states.
7. **Decouple `TeacherFeedbackView` and `OfficialRecordsView` from `logic` prop** — full data-flow isolation.

**Low priority (accept as-is for now):**

- `structuredClone` in simulation logic (V8 is fast enough).
- Array allocation in `sortGroups` (negligible for typical dataset sizes).
- 8-way lazy chunk splitting (HTTP/2 multiplexing).

---

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `startTransition` on tab switch could cause stale UI if the pending state shows old data before new chunk loads | Low | Medium | Keep Suspense fallback as the pending fallback; transition only delays fallback display |
| Reusing memoized data in `handleExportConsolidadoCompleto` could export stale data if memo deps haven't updated | Low | Low | The handler reads the same reactive variables (`config`, `activeGroupToUse`) — if they haven't changed, memo data is fresh |
| Changing view props (`logic` removal) could break child view behavior if they depend on `logic` functions | Medium | Medium | Requires careful audit of what `logic` functions are used; `setPeriodName` and `setDirectorName` are particularly tricky |
| Pipeline deduplication in `AnalysisTab.tsx` changes KPI comparison behavior | Low | Medium | `originalKpis` must still compute from unfiltered `rowsArea`, not from `currentRowsArea` |

---

### Ready for Proposal

**Yes** — all three issues are well-understood. The fixes mostly involve targeted changes with clear scope:

- **Issue 1**: Refactor `AnalysisTab.tsx` pipeline calls (1 hour), accept clone behavior as-is.
- **Issue 2**: Add `startTransition` (15 min), decouple 2 view props (2 hours), stabilize return value (30 min).
- **Issue 3**: Tighten `canExportConsolidadoCompleto` (15 min), reuse memoized data (30 min), derive count from `menuItems` (10 min).

Total estimated implementation: **~4-5 hours** for all recommended fixes.

The orchestrator should present this exploration to the user and ask if they want to proceed with a proposal covering these specific fixes, or prioritize a subset.
