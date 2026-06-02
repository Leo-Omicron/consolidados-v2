# Design: Critical Bugs & Technical Debt Remediation

## Technical Approach

Refactor in strict dependency order: shared logic extraction first, then consumer updates, then monolith decomposition. Five independent work units, each committable and testable in isolation. All 270+ existing tests must pass after each unit.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Constants location | `academicLogic.ts` (existing export) | New `src/domain/constants.ts` | `PASSING_GRADE` already exported here; adding a new file for one constant is premature abstraction. Consumers already import from this module. |
| Period detection dedup | Call `getEvaluatedPeriods()` in consumers | Extract to separate `periodDetection.ts` | The function already exists and is exported. VolatilityTab and useReportsLogic duplicate it inline. No new module needed. |
| useEffect removal | Derive `activeGroup` in render; remove effect | Wrap `setGlobalGroup` in event handlers only | `activeGroup` is already derived correctly (line 24 in VolatilityTab, line 24 in TutorsTab). The effect only mutates global store — pure side effect without benefit. |
| AnalysisTab decomposition | 4 sub-components under `AnalysisTab/` dir | Extract to `src/components/analysis/` | Existing sub-components (EditableGradeCell, GoalSeekCell, AnalysisKPIs) already live under `AnalysisTab/`. Follow the established pattern. |
| IndexedDB fix | Remove `estudiantes` from `partialize` + simplify `merge` | Conditionally exclude large arrays | `partialize` controls what Zustand persists. Removing one key is simpler and safer than size-checking. |

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  DashboardStore (Zustand)                                    │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐             │
│  │estudiantes│  │rowsArea  │  │selectedGrupo  │             │
│  │(in-memory)│  │(derived) │  │(persisted)    │             │
│  └──────────┘  └──────────┘  └───────┬───────┘             │
│                                      │                      │
│  IndexedDB persist ──────────────────┘                      │
│  (NO estudiantes — only config, weights, selectedGrupo...)  │
└─────────────────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
┌──────────────────┐    ┌─────────────────────────┐
│ getEvaluatedPer- │    │ AnalysisTab sub-comp.    │
│ iods(estudiantes)│    │ ┌──────────┐ ┌────────┐ │
│ ← single source  │    │ │FiltersBar│ │KPI     │ │
│ for all 3 sites  │    │ └──────────┘ └────────┘ │
└──────────────────┘    │ ┌──────────────┐        │
        │               │ │StudentTable  │        │
        ▼               │ └──────────────┘        │
┌──────────────────┐    └─────────────────────────┘
│ PASSING_GRADE    │
│ (single constant │
│  imported by     │
│  reportEngine,   │
│  SummaryTab,     │
│  VolatilityTab,  │
│  TutorsTab,      │
│  HeatmapTab,     │
│  BattleTab,      │
│  OfficialRecView)│
└──────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/services/academicLogic.ts` | Modify | Export `getEvaluatedPeriods` unchanged (already exported). No code changes — it's already the canonical implementation. |
| `src/services/reportEngine.ts` | Modify | Import `PASSING_GRADE`; replace 7 hardcoded `3.0` comparisons in `getFailedAreasCount`, `getFailedAreasNames`, `determinePromotionDecision`, `generateGroupPerformanceReport`, `generateSubjectAnalyticsReport`, `generateTeacherFeedbackReportForGroup`. |
| `src/components/dashboard/SummaryTab.tsx` | Modify | Import `PASSING_GRADE`; replace 5 hardcoded `3.0` sites (thresholdLinePlugin: `getPixelForValue(3.0)`, `fillText('Mínimo: 3.0')`; studentKPIs `promedioActual < 3.0`; statusChartData thresholds). |
| `src/components/dashboard/VolatilityTab.tsx` | Modify | (1) Remove `useEffect` block (lines 26-30). (2) Replace inline period detection (lines 32-52) with `getEvaluatedPeriods(estudiantes)`. (3) Import `PASSING_GRADE`; replace bar color threshold line 206. |
| `src/components/dashboard/TutorsTab.tsx` | Modify | (1) Remove `useEffect` block (lines 27-31). (2) Import `PASSING_GRADE`; replace threshold on lines 57/60. |
| `src/components/dashboard/HeatmapTab.tsx` | Modify | Import `PASSING_GRADE`; replace 5 hardcoded `3.0` sites (color function, label function, title string, failingCount, failed increment). |
| `src/components/dashboard/BattleTab.tsx` | Modify | Import `PASSING_GRADE`; replace `promedioActual < 3.0` on line 137. |
| `src/components/dashboard/ReportsTab/views/OfficialRecordsView.tsx` | Modify | Import `PASSING_GRADE`; replace `grade < 3.0` on line 79. |
| `src/components/dashboard/ReportsTab/views/GroupComparisonView.tsx` | Modify | Import `PASSING_GRADE`; replace tooltip string "menor a 3.0" with template literal. |
| `src/components/dashboard/ReportsTab/useReportsLogic.ts` | Modify | Replace inline period detection (lines 39-61) with `getEvaluatedPeriods(estudiantes)`. Import from academicLogic. |
| `src/store/useDashboardStore.ts` | Modify | Remove `estudiantes` from `partialize` (line 161). Simplify `merge` — remove estudiantes reconstruction block (lines 171-175) since estudiantes won't be persisted. |
| `src/components/dashboard/AnalysisTab.tsx` | Modify | Reduce to ~180 lines: orchestrator that composes sub-components. Keep state hooks, `useMemo` derivations, hash import effect, and the 4 new sub-component invocations. |
| `src/components/dashboard/AnalysisTab/FiltersBar.tsx` | Create | Extract lines 258-305 (group selector, search input, area/subject filter, status filter). Props: `selectedGrupo`, `availableGroups`, `onGroupChange`, `filters`, `onFiltersChange`, `uniqueAreas`, `uniqueStatuses`, `viewMode`. |
| `src/components/dashboard/AnalysisTab/SimulationBanner.tsx` | Create | Extract lines 161-192. Props: `activeSimulationCount`, `onExportHash`, `onClearSimulations`. |
| `src/components/dashboard/AnalysisTab/SubjectWeightsPanel.tsx` | Create | Extract lines 215-255 (collapsible weights accordion). Props: `weightsToDisplay`, `isExpanded`, `onToggle`. |
| `src/components/dashboard/AnalysisTab/StudentGroupTable.tsx` | Create | Extract lines 317-672 (grouped table with expansion). Props: `sortedGroups`, `expandedGroups`, `onToggleGroup`, `expandedAreas`, `onToggleArea`, `activeSimulations`, `viewMode`, `hasP4`, `evaluated`, `config`, `subjectsByStudentArea`, `onSort`, `sortConfig`, `onSetSimulation`, `onClearSimulation`. |
| `openspec/config.yaml` | Create | SDD workflow bootstrap: `schema`, `project` metadata, design/task rules. |

## Interfaces / Contracts

### New sub-component props

```typescript
// FiltersBar
interface FiltersBarProps {
  selectedGrupo: string;
  availableGroups: string[];
  onGroupChange: (grupo: string) => void;
  filters: { search: string; area: string; status: string };
  onFiltersChange: (updater: (prev: FiltersState) => FiltersState) => void;
  uniqueAreas: string[];
  uniqueStatuses: string[];
  viewMode: 'area' | 'subject';
}

// SimulationBanner
interface SimulationBannerProps {
  activeCount: number;
  onExportHash: () => string;
  onClearAll: () => void;
}

// SubjectWeightsPanel
interface SubjectWeightsPanelProps {
  weights: Record<string, unknown>;
  isExpanded: boolean;
  onToggle: () => void;
}

// StudentGroupTable (abridged — mirrors current inline table)
interface StudentGroupTableProps {
  sortedGroups: GroupedRow[];
  expandedGroups: Record<string, boolean>;
  onToggleGroup: (estudiante: string) => void;
  // ... (12 props total, all extracted from AnalysisTab's closure)
}
```

### Store contract change

```typescript
// Before (useDashboardStore.ts partialize)
partialize: (state) => ({
  estudiantes: state.estudiantes,   // REMOVED
  config: state.config,
  // ...
})

// After
partialize: (state) => ({
  config: state.config,
  subjectWeights: state.subjectWeights,
  selectedGrupo: state.selectedGrupo,
  availableGroups: state.availableGroups,
  viewMode: state.viewMode,
  diagnosticReport: state.diagnosticReport,
})
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit — academicLogic | `getEvaluatedPeriods` called from new consumers | Existing tests already cover it. Verify no regression with `grep` for inline period detection remains. |
| Unit — constants | PASSING_GRADE imported everywhere | Grep for `3\.0` in production `*.tsx`/`*.ts` (NOT test files) and verify all remaining occurrences are intentional (axis labels, test data, unrelated `2.95` fudge). |
| Component — VolatilityTab | Renders without global mutation | Mock store; assert `setGrupo` is NOT called during mount. Use RTL `render()`. |
| Component — TutorsTab | Same as above | Same approach. |
| Component — AnalysisTab | Sub-components compose correctly | Render AnalysisTab; assert FiltersBar, AnalysisKPIs, StudentGroupTable are present. Verify simulation banner shows when activeSimulations populated. |
| Integration — IndexedDB | Reload preserves derived data | `processFiles()` → reload → verify `rowsArea` and `rowsAsignatura` restored from pipeline (not from IndexedDB). |
| Regression | 270+ existing tests pass | Run `npx vitest run` after each work unit. |

## Migration / Rollout

No data migration required. Each step is independent and committable:
1. **Commit 1**: `PASSING_GRADE` constant import + period dedup (academicLogic, reportEngine, useReportsLogic)
2. **Commit 2**: Replace hardcoded `3.0` across all UI components (SummaryTab, VolatilityTab, TutorsTab, HeatmapTab, BattleTab, OfficialRecordsView, GroupComparisonView)
3. **Commit 3**: useEffect removal in VolatilityTab + TutorsTab
4. **Commit 4**: AnalysisTab decomposition (4 new files + AnalysisTab slimming)
5. **Commit 5**: IndexedDB estudiantes removal + merge cleanup
6. **Commit 6**: openspec/config.yaml bootstrap

Rollback: revert any offending commit. Preceding commits remain valid.

## Open Questions

- None. All technical decisions are resolved through codebase inspection.
