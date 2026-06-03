## Exploration: Phase 18 — What-If Calculator

### Current State

#### AnalysisTab Architecture

The AnalysisTab (`src/components/dashboard/AnalysisTab.tsx`, 481 lines) is a **read-only** table. Its data flow is:

1. **Store selectors**: Reads `rowsArea`, `rowsAsignatura`, `viewMode`, `config`, `selectedGrupo`, `availableGroups`, `subjectWeights` from `useDashboardStore`.
2. **UI State**: Reads `analysisFilters`, `analysisSortConfig` from `useUIStore`.
3. **Pipeline**: Passes active rows + filters + sortConfig + viewMode to `useAnalysisPipeline(activeRows, selectedGrupo, filters, sortConfig, viewMode)`.
4. **Output**: Returns `{ groupedAndSorted, kpis }` — grouped by student, with aggregates, sorted, filtered.

**Row types**: `RowArea` and `RowAsignatura` are flat denormalized records with fields:
- `RowArea`: `defP1`–`defP4`, `area`, `promActual`, `p4Min`, `estado`
- `RowAsignatura`: `p1`–`p4`, `asignatura`, `area`, `promActual`, `p4Min`, `estado`

**Table rendering**:
- The outer list renders `StudentGroup` items (expand/collapse per student).
- Inside, an HTML `<table>` renders rows (Area rows in area mode, assignment rows in subject mode).
- In area mode with a row expanded, a **nested sub-table** displays the assignment rows for that area.
- Grade cells are rendered as plain `<td>` with `row.defP1?.toFixed(2) ?? '-'` — no editability.

#### Store Architecture (useDashboardStore)

Single Zustand store with:
- **State**: `estudiantes[]` (canonical nested tree), `rowsArea[]`, `rowsAsignatura[]` (denormalized flat views), `config`, `subjectWeights`, `selectedGrupo`, `viewMode`
- **Actions**: `processFile(file)`, `setConfig(config)`, `setGrupo(grupo)`, `setViewMode(mode)`, `updateSubjectWeight(...)`
- **Critical pattern**: `applyAcademicLogic` **mutates** `estudiantes` in-place, then `flattenRows` regenerates the flat arrays. This happens in `processFile`, `setConfig`, and `updateSubjectWeight`.

There is no separate simulation store. All data is "real."

#### Academic Logic (academicLogic.ts)

Pure functions:
- `calcularPromedioActual(notas, config, evaluated)`: Weighted average using `PeriodoNotas` (P1–P4). Accepts optional `evaluated` map.
- `calcularMinimoRequerido(notas, config, evaluated)`: Projects required grade in remaining periods to reach `PASSING_GRADE = 3.0`.
- `determinarEstado(notas, config, evaluated)`: Returns `{ text, color }` — Ganado, Perdido, En riesgo, Recuperable, Ganable.
- `applyAcademicLogic(students, config, subjectWeights)`: **Mutates** the students array in place. Sets `asig.promedioActual`, `asig.p4Min`, `asig.estado`, then calculates Area DEF dynamically from subject weights, then sets `area.areaStats`.

All functions accept `evaluated: { P1, P2, P3, P4 }` which indicates which periods have already been evaluated. Missing-but-evaluated periods are treated as 0.0.

**Key insight**: The academic logic already supports partial evaluation via the `evaluated` parameter. If we want to simulate "what if P3 were 4.5 instead of the actual 3.0", we can create a copy of `notas` with the simulated value and pass it to these functions.

#### Types (domain/types.ts)

- `PeriodoNotas`: `{ P1, P2, P3, P4 }` — raw grade data
- `EvaluacionStats`: `{ promedioActual, p4Min, estado }` — computed stats
- `Asignatura extends PeriodoNotas, EvaluacionStats`: subject with raw + computed
- `Area`: `{ asignaturas, DEF, areaStats? }`
- `Estudiante`: `{ id, name, CURSO, grupo, areas }`
- `RowArea` / `RowAsignatura`: flat denormalized views with grade columns + computed stats

**No simulation fields exist anywhere.** This is a greenfield addition.

---

### Affected Areas

| File | Why Affected |
|------|--------------|
| `src/services/academicLogic.ts` | Need non-mutating overloads that accept override maps |
| `src/store/useDashboardStore.ts` | Add simulation state or new store slice |
| `src/store/useSimulationStore.ts` | **New** — separate store for simulation state |
| `src/components/dashboard/AnalysisTab.tsx` | Editability in cells + simulation UI |
| `src/components/dashboard/SimulationControls.tsx` | **New** — reset buttons, badges, indicators |
| `src/domain/types.ts` | Either extend types or leave pristine (depends on approach) |
| `src/hooks/useAnalysisPipeline.ts` | Needs to accept simulated rows |
| `src/services/academicLogic.test.ts` | New test cases for overrides |
| `src/components/dashboard/AnalysisTab.test.tsx` | Test editable behavior |
| `src/store/useSimulationStore.test.ts` | **New** — test simulation store |

---

### Approach Comparison

#### A. Data Model: Where to store simulated grades

**Approach A: Extend existing types with optional `simulated*` fields**

Add `simulatedP1?: number | null` to `PeriodoNotas` or to `RowAsignatura`/`RowArea`.

- **Pros**: Simplest wiring — `(row.simulatedP1 ?? row.p1)` everywhere. No extra indirection. Existing memo references still work.
- **Cons**: Pollutes domain types with UI-only concern. Bloats the canonical `Estudiante` model. Need to strip simulation before export. Type confusion between "real" and "what-if."
- **Effort**: Low

**Approach B: Separate `SimulationOverlay` map (RECOMMENDED)**

A `Map<string, Partial<PeriodoNotas>>` keyed by `"studentId:areaName:subjectName"` or flat `RowArea.id` / `RowAsignatura.id`. Stored in a separate Zustand slice.

- **Pros**: Zero pollution of domain types. Easy to clear all simulations (just empty the map). Can be serialized/deserialized independently. Explicit boundary between real and simulated.
- **Cons**: Every grade read becomes `simulations.get(row.id)?.P1 ?? row.p1`. Slightly more indirection in rendering.
- **Effort**: Medium

**Approach C: Clone the whole student array for simulation**

Deep-clone `estudiantes` → mutate clones with simulated grades → re-run `applyAcademicLogic` and `flattenRows` on the clone.

- **Pros**: Clean separation. Uses existing logic 100% as-is. No type changes.
- **Cons**: Expensive for large datasets (500+ students with 10+ areas each = deep clone of a large object graph). Memo references break on every keystroke. Would need debouncing. Overkill for real-time per-keystroke updates.
- **Effort**: High (performance tuning)

**Verdict: Approach B** — overlay map is the cleanest. The key design decision is the key format:
- For subject rows: `"${studentId}::${areaName}::${asignaturaName}"` or just use `RowAsignatura.id` (which is already `"${studentId}_${areaName}_${asigName}"`).
- For area rows: `"${studentId}_${areaName}"` matching `RowArea.id`.

#### B. Store Architecture

**Option 1: Separate `useSimulationStore` (RECOMMENDED)**

```ts
interface SimulationState {
  activeSimulations: Record<string, Partial<PeriodoNotas>>; // keyed by row id
  setSimulation: (rowId: string, period: keyof PeriodoNotas, value: number | null) => void;
  clearSimulation: (rowId: string) => void;
  clearAllSimulations: () => void;
}
```

- **Pros**: Clean separation of concerns. No accidental mixing of simulated/real data. Easy to test independently. Can be cleared independently (e.g., when changing groups).
- **Cons**: AnalysisTab needs to read from two stores. Slightly more wiring.
- **Effort**: Medium

**Option 2: Add simulation slice to `useDashboardStore`**

- **Pros**: Single store access in AnalysisTab. Less boilerplate overall.
- **Cons**: The store is already responsible for file processing, config, weights, view mode — adding simulation clutters it. When clearing simulations, we might accidentally trigger file-related re-renders.
- **Effort**: Low (initial), Medium (maintenance)

**Verdict: Option 1**. The dashboard store already has distinct responsibilities. Simulation is a purely UI-interactive concern that doesn't touch file processing or config. A separate store keeps things testable and avoids unnecessary re-renders of non-simulation components.

#### C. Academic Logic Adaptation

The existing functions (`calcularPromedioActual`, `calcularMinimoRequerido`, `determinarEstado`) already work correctly with simulated grades — they just need `PeriodoNotas` with the simulated values. **No changes needed** to these individual functions.

The adaptation is in `applyAcademicLogic`:
1. **New function**: `applyAcademicLogicWithOverrides(students, config, subjectWeights, overlays: Record<string, Partial<PeriodoNotas>>)` — creates a deep-enough copy of the student data per row (or, better, passes overrides through the computation pipeline).
2. **Alternative**: Don't modify `applyAcademicLogic` at all. Instead:
   - When a simulation is set, lookup the affected row
   - Create a temporary merged `PeriodoNotas`: `{ ...realNotas, ...simulatedOverride }`
   - Call `calcularPromedioActual(mergedNotas, config, evaluated)` etc. directly
   - Store the computed result in the simulation overlay alongside the input values

**Recommended approach**: Store computed results in the overlay too:
```ts
interface SimulationResult {
  // input
  overrides: Partial<PeriodoNotas>;
  // computed
  promActual: number | null;
  p4Min: number | null;
  estado: EstadoAcademico;
}
```

This way, when a user types "4.5" in P3:
1. `setSimulation(rowId, { P3: 4.5 })` is called
2. The store's action computes `calcularPromedioActual`, `calcularMinimoRequerido`, `determinarEstado` using the merged grade
3. The component reads `simulationResults[rowId]` or falls back to the original row data

**Performance**: Computing 3 pure functions per keystroke is trivial (< 0.01ms). No debouncing needed.

#### D. UI Interaction Design

**Cell Editability**:
- **Which cells?** P1–P4 grade cells only (not `promActual`, `p4Min`, `estado`, `tendencia` — those are computed).
- **For area rows**: `defP1`, `defP2`, `defP3`, `defP4`.
- **For subject rows**: `p1`, `p2`, `p3`, `p4`.
- **Not editable**: The final DEF grade if it's computed from weights (but the underlying subject grades will be editable).

**Interaction pattern**:
1. Click on a grade cell → cell transforms into an `<input>` with the current value pre-filled
2. Type the hypothetical grade → on each keystroke, recalculate `promActual`, `p4Min`, `estado` for that row
3. Press `Enter` or blur → commit the simulation (keep the simulated value visible)
4. Press `Escape` → cancel, revert to original value
5. Visual: amber/yellow background on simulated cells. The cell shows the simulated value; the computed fields in the same row update in real-time.

**Visual indicators**:
- Simulated grade cell: amber/yellow background (`bg-amber-50` / `border-amber-300`), slight glow
- Computed fields influenced by simulation: no special background (they already reflect the updated values), but could show a small "S" badge
- Student group header: if any row in the group is simulated, show a "Simulaciones activas" badge + "Reset" button
- Global: "Reset all simulations" button in the top bar

**KPI updates**:
- `promedioGeneral` and `statusDistribution` in the KPI cards should update in real-time using simulated values
- This means `useAnalysisPipeline` needs to be aware of simulations (or the KPI computation gets a secondary pass with overlay data)

**Reset behavior**:
- Per-cell: click the input again and delete the value (sets to `null` → fallback to original)
- Per-student: reset icon in the group header
- Global: "Reset all simulations" button

#### E. Edge Cases

| Edge Case | Handling |
|-----------|----------|
| **Student without P4 simulating P4** | Allow it. The config knows about P4 (hasP4 flag). Simulating a non-existent period is valid — the academic logic treats it as a future period with the simulated grade. |
| **Grade out of range (e.g., 7.0 on 0–5 scale)** | Clamp. Grades > 5.0 or < 0.0 are invalid. The input should validate: `min=0`, `max=5`, `step=0.1`. On blur/clamp, clip to [0, 5]. |
| **Multiple students simulated simultaneously** | Supported naturally — the overlay map is keyed by row ID. Each simulation is independent. |
| **Switching view mode while simulations active** | Simulations persist (they're keyed by row ID). When switching from area to subject view, the same underlying data is affected. The overlay map works for both `RowArea` and `RowAsignatura` IDs. |
| **Changing group filter** | The pipeline already filters by group. Simulations on filtered-out students remain in the overlay but don't appear visually. If a user re-selects the group, simulations reappear. No data loss. |
| **Clearing + re-parsing file** | Simulations must be cleared when a new file is processed (or at least invalidated). The simulation store should have a `clearAllSimulations` action called from `processFile`. |
| **Loading config changes** | Simulations should be preserved (they override grades, not weights or config). But underlying computed values change because config changed. Recompute all active simulations when config changes. |

---

### Recommendation

1. **Data model**: **Approach B** — `SimulationOverlay` map keyed by row ID. Store both input overrides and computed results in a separate Zustand store.

2. **Store**: **Separate `useSimulationStore`** with actions: `setSimulation(rowId, period, value)`, `clearSimulation(rowId)`, `clearAllSimulations()`. Store computed results (`promActual`, `p4Min`, `estado`) alongside overrides to avoid redundant computation on every render.

3. **Academic logic**: Create a thin **`computeSimulatedRow(originalRow, overrides, config, evaluated)`** function that:
   - Merges `originalRow` grades with overrides
   - Calls `calcularPromedioActual`, `calcularMinimoRequerido`, `determinarEstado` with the merged grades
   - Returns `{ promActual, p4Min, estado }`
   - No changes needed to the existing pure functions.

4. **UI**: Editable cells only on P1–P4 grade columns. Click → input → enter/blur to confirm, escape to cancel. Amber background for simulated cells. Per-student reset + global reset.

5. **Pipeline integration**: `useAnalysisPipeline` needs an optional second source of data. Either:
   - Accept a `simulationResults` parameter and merge it into augmented rows, OR
   - Have the AnalysisTab post-process the pipeline output to apply simulations (simpler, more contained)

**Recommended integration** (minimal blast radius):
- After `useAnalysisPipeline` returns `groupedAndSorted`, use a `useMemo` in AnalysisTab to merge simulation data into the rows.
- This keeps the pipeline pure and unaware of simulations.
- The KPIs need a similar treatment — recalculate with simulated values in AnalysisTab, or pass a merged row set back through the pipeline.

6. **KPI updates**: Rather than modifying `useAnalysisPipeline`, compute adjusted KPIs in a `useMemo` inside AnalysisTab that reads `simulationStore` and recalculates averages/status distribution. This keeps the change contained.

---

### Risks

- **Performance on large datasets**: Computing simulations on every keystroke for a single row is cheap (< 0.01ms). But if the user rapidly edits multiple cells, the overlay map updates + re-renders + KPI recalculation could cause jank. Mitigation: use `React.memo` on row components and debounce KPI calculation at 100ms.
- **Simulation persistence across view changes**: Must ensure overlay is keyed consistently. Using `RowArea.id` (`"studentId_areaName"`) and `RowAsignatura.id` (`"studentId_areaName_asigName"`) is stable across view mode switches.
- **Area DEF recalculation**: If a subject grade is simulated, the area DEF also changes (because DEF is a weighted combination of subjects). Solution: when a subject simulation changes, also compute the simulated area DEF for display. This means we might need to recalculate siblings. **Simpler approach**: only simulate at the displayed granularity. In subject mode, simulate `p1`; in area mode, simulate `defP1`. Don't cascade subject simulations to area DEF automatically — the user can also simulate the area DEF directly.
- **Test complexity**: Editable cells need `fireEvent.change` + `fireEvent.blur` or `fireEvent.keyDown(enter)` tests. The simulation store test is straightforward (Zustand).

---

### Estimated Impact

| Category | Files | Lines Changed/Added |
|----------|-------|-------------------|
| New store | `src/store/useSimulationStore.ts` | ~50 new |
| Store tests | `src/store/useSimulationStore.test.ts` | ~80 new |
| New helper | `src/services/simulationLogic.ts` | ~40 new |
| Helper tests | `src/services/simulationLogic.test.ts` | ~100 new |
| AnalysisTab changes | `src/components/dashboard/AnalysisTab.tsx` | ~100 modified (cell rendering + editability) |
| AnalysisTab tests | `src/components/dashboard/AnalysisTab.test.tsx` | ~100 new (editable cell tests) |
| Pipeline awareness | `src/hooks/useAnalysisPipeline.ts` | ~0–20 (minimal or zero changes) |
| Types | `src/domain/types.ts` | ~0 (overlay approach needs no type changes) |
| **Total** | **~7–8 files** | **~400–450 new/changed lines** |

---

### Ready for Proposal
Yes. The approach is clear: separate simulation store, overlay data model, minimal changes to existing pure functions, and cell editability confined to the AnalysisTab rendering layer. The proposal should cover the store contract, the simulation logic helper, and the UI component changes in detail.
