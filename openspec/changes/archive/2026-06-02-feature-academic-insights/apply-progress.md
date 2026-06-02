# Apply Progress: feature-academic-insights — PR 1 + PR 2 + PR 3

**Mode**: Strict TDD  
**Date**: 2026-06-02  
**Tests**: 420 tests (36 files — all green)

## Completed Tasks (Phases 1–5)

### Phase 1: Foundation — Types & Core Logic (PR 1)

- [x] 1.1 Types added: `PedagogicalArchetype`, `ArchetypeSeverity`, `ArchetypeResult`, `InsightCounts`
- [x] 1.2 `detectConfiado(periodGrades)` — monotonic non-increasing decline from high start
- [x] 1.3 `detectResiliente(periodGrades)` — monotonic non-decreasing rise from low start
- [x] 1.4 `detectMontanaRusa(periodGrades)` — oscillating grades with sign-change detection
- [x] 1.5 `detectRadar(periodGrades)` — fallback warning-flag detector
- [x] 1.6 `detectArchetype(periodGrades)` — orchestrator with tie-breaking
- [x] 1.7 `generateNarrative(archetype, confidence, periodGrades)` — Spanish pedagogical text
- [x] 1.8 `calculateStudentPeriodAverages(estudiante)` — area DEF averaging across periods
- [x] 1.9 Verified: evolutionLogic uses identical weighting (area DEF simple average). Duplicated pattern in insightsLogic; shared extraction deferred to avoid PR scope creep.

### Phase 2: Foundation Tests (PR 1)

- [x] 2.1 Confiado: sustained decline, minor fluctuation, non-monotonic, confidence scaling
- [x] 2.2 Resiliente: sustained rise, small improvement, non-monotonic, confidence scaling
- [x] 2.3 Montaña Rusa: alternating, smooth monotonic, single sign change, small swings
- [x] 2.4 Radar: final failing, sharp drop trigger, no flags → null, confidence scaling
- [x] 2.5 Insufficient-data: single period → null, two periods → proceeds
- [x] 2.6 Tie-break: confiado > montana-rusa > radar resolved correctly

### Phase 3: Hook & UI Components (PR 2)

- [x] 3.1 `useInsights.ts` — reads `estudiantes` from store, calls `getEvaluatedPeriods` + `calculateStudentPeriodAverages` → `detectArchetype`, fills student metadata (id, name, grupo), aggregates counts, returns `{ results, counts, evaluatedPeriods }` via `useMemo`. Zero store writes.
- [x] 3.2 `InsightsFilter.tsx` — dropdown with 5 options: "Todos", "El Confiado", "El Resiliente", "Montaña Rusa", "Radar". Controlled component with `value`/`onChange`.
- [x] 3.3 `ArchetypeCard.tsx` — displays student name, grupo, period-grade pills (nulls → "—"), archetype label badge, severity badge (Alerta/Moderado/Bajo) with color coding, narrative text, confidence percentage. Left-border color per archetype.
- [x] 3.4 `InsightsTab.tsx` — header, KPI row (4 archetype count cards with severity colors), filter dropdown, grouped ArchetypeCard grid, empty state ("No hay datos suficientes") when no students or insufficient data.

### Phase 4: Component Tests (PR 2)

- [x] 4.1 `useInsights.test.ts` — 11 tests: empty store, evaluated periods, all 4 archetypes (Confiado/Resiliente/MontañaRusa/Radar), insufficient data → null, aggregate counts, null period handling, store immutability assertion, useMemo stability.
- [x] 4.2 `ArchetypeCard.test.tsx` — 12 tests: student name, period pills (including null → "—"), all 4 archetype labels, severity badges (high/medium), narrative text, confidence percentage, grupo info.
- [x] 4.3 `InsightsTab.test.tsx` — 6 tests: empty state, KPI cards, student card rendering, filter interaction (Todos → Confiado filters cards), store immutability on mount, empty state with insufficient-data students.

### Phase 5: Tab Registration & Integration (PR 3)

- [x] 5.1 Modified `src/domain/types.ts` — added `'insights'` to `ReportCategory` union type. Modified `src/components/dashboard/ReportsTab.tsx` — added `InsightsTab` lazy import with `startTransition` wiring, added `{ id: 'insights', label: 'Oracle Insights', icon: '🔮' }` to `menuItems`. (Note: project uses `ReportsTab.tsx` sub-tab system, not `Header.tsx`/`MainLayout.tsx` as originally listed in tasks.)
- [x] 5.2 Added rendering case `{logic.activeTab === 'insights' && <InsightsTab />}` inside Suspense block in `ReportsTab.tsx`.
- [x] 5.3 Full integration verification: `npx vitest run` → 420 tests green (36 files). InsightsTab renders within ReportsTab via lazy loading, archetypes compute on real store data, no TS errors, store immutability preserved.

## TDD Cycle Evidence

### PR 1 (Phases 1 & 2)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `insightsLogic.test.ts` | Unit | N/A (new) | ✅ Written (type import) | ✅ Passed (types added) | ➖ Structural | ➖ None needed |
| 1.2/2.1 | `insightsLogic.test.ts` | Unit | ✅ 379/379 | ✅ 6 failing tests | ✅ 6/6 passing | ✅ 6 cases (3 spec + 3 edge) | ✅ Clean |
| 1.3/2.2 | `insightsLogic.test.ts` | Unit | — | ✅ 6 failing tests | ✅ 6/6 passing | ✅ 6 cases (2 spec + 4 edge) | ✅ Clean |
| 1.4/2.3 | `insightsLogic.test.ts` | Unit | — | ✅ 6 failing tests | ✅ 6/6 passing | ✅ 6 cases (2 spec + 4 edge) | ✅ Clean |
| 1.5/2.4 | `insightsLogic.test.ts` | Unit | — | ✅ 5 failing tests | ✅ 5/5 passing | ✅ 5 cases (2 spec + 3 edge) | ✅ Clean |
| 1.6/2.5/2.6 | `insightsLogic.test.ts` | Unit | — | ✅ 10 failing tests | ✅ 10/10 passing | ✅ 10 cases (insufficient-data + orchestrator + tie-break) | ✅ Clean |
| 1.7 | `insightsLogic.test.ts` | Unit | — | ✅ 5 failing tests | ✅ 5/5 passing | ✅ 5 cases (4 archetypes + grades check) | ✅ Clean |
| 1.8 | `insightsLogic.test.ts` | Unit | — | ✅ 3 failing tests | ✅ 3/3 passing | ✅ 3 cases (single area, multi area, all null) | ✅ Clean |
| 1.9 | — | — | N/A | Verified weighting match | Confirmed identical | ➖ Verification only | ➖ Deferred to avoid PR scope creep |

### PR 2 (Phases 3 & 4)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 3.1/4.1 | `useInsights.test.ts` | Unit (hook) | ✅ 379/379 | ✅ File not found (RED) | ✅ 11/11 passing | ✅ 11 cases (empty, 4 archetypes, radar, nulls, counts, immutability, memo stability) | ✅ Clean (removed unused import) |
| 3.3/4.2 | `ArchetypeCard.test.tsx` | Component | ✅ 390/390 | ✅ File not found (RED) | ✅ 12/12 passing | ✅ 12 cases (name, pills, null pills, 4 labels, severity×2, narrative, confidence, grupo) | ➖ Clean |
| 3.2 | `InsightsFilter.test.tsx` | Component | ✅ 402/402 | ✅ File not found (RED) | ✅ 6/6 passing | ✅ 6 cases (options, default, selected value, onChange×2, option count) | ➖ Clean |
| 3.4/4.3 | `InsightsTab.test.tsx` | Component | ✅ 408/408 | ✅ File not found (RED) | ✅ 6/6 passing | ✅ 6 cases (empty state, KPIs, student cards, filter, immutability, insufficient data) | ➖ Clean |

### PR 3 (Phase 5 — Wiring)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 5.1/5.2 | `ReportsTab-insights-wiring.test.tsx` | Integration | ✅ 414/414 | ✅ 5 failing (button not found) | ✅ 6/6 passing | ✅ 6 cases (menu item presence×2, tab navigation×3, store immutability) | ✅ Clean (async query fixes) |
| 5.3 | Full suite (`npx vitest run`) | Integration | ✅ 420/420 | N/A (verification) | ✅ 420/420 passing | N/A | N/A |

### PR 3 Test Details
- **RED (5 tests)**: Button "Oracle Insights" not found — `ReportCategory` didn't include `'insights'`, no menu item existed, no lazy import, no rendering case.
- **GREEN (6 tests)**: Added `'insights'` to type, added lazy import, menu item, and rendering case. Two assertion fixes needed (async `findByRole` for lazy-loaded component, `getByRole('heading')` to disambiguate from sidebar button).
- **TRIANGULATE (6 cases)**: Empty students (button hidden), students present (button visible), tab switch + aria-pressed + store update, KPI rendering via ReportsTab, empty state via ReportsTab, store immutability assertion.

## Total Test Summary
- **PR 1 tests**: 45 (unit — pure logic)
- **PR 2 tests**: 35 (11 hook + 12 card + 6 filter + 6 tab)
- **PR 3 tests**: 6 (integration — wiring)
- **Combined**: 86 new tests
- **Full suite**: 36 files, 420 tests, all green
- **Layers used**: Unit (56), Component (24), Integration (6)
- **Approval tests**: None
- **Pure functions created**: 8 in PR 1, plus hook aggregation logic in PR 2

## Files Changed

### PR 1
| File | Action | What Was Done |
|------|--------|---------------|
| `src/domain/types.ts` | Modified | Added `PedagogicalArchetype`, `ArchetypeSeverity`, `ArchetypeResult`, `InsightCounts` |
| `src/services/insightsLogic.ts` | Created | Pure detectors, orchestrator, narrative generator, period average calculator |
| `src/services/insightsLogic.test.ts` | Created | 45 unit tests covering all spec scenarios + edge cases |

### PR 2
| File | Action | What Was Done |
|------|--------|---------------|
| `src/hooks/useInsights.ts` | Created | Reads store → calls insightsLogic → returns `{ results, counts, evaluatedPeriods }` via `useMemo`. Zero store writes. |
| `src/hooks/useInsights.test.ts` | Created | 11 hook tests (renderHook via @testing-library/react) |
| `src/components/dashboard/InsightsTab/InsightsFilter.tsx` | Created | Controlled dropdown: "Todos" + 4 archetypes |
| `src/components/dashboard/InsightsTab/InsightsFilter.test.tsx` | Created | 6 component tests (options, selection, onChange) |
| `src/components/dashboard/InsightsTab/ArchetypeCard.tsx` | Created | Student card: name, grupo, period pills, archetype/severity badges, narrative, confidence |
| `src/components/dashboard/InsightsTab/ArchetypeCard.test.tsx` | Created | 12 component tests (all labels, severities, null grades, narrative) |
| `src/components/dashboard/InsightsTab.tsx` | Created | KPI row, filter, grouped ArchetypeCard grid, empty state |
| `src/components/dashboard/InsightsTab.test.tsx` | Created | 6 component tests (KPIs, filter, cards, immutability, empty state) |

### PR 3
| File | Action | What Was Done |
|------|--------|---------------|
| `src/domain/types.ts` | Modified | Added `'insights'` to `ReportCategory` union |
| `src/components/dashboard/ReportsTab.tsx` | Modified | Added `InsightsTab` lazy import (line 13), menu item `{ id: 'insights', label: 'Oracle Insights', icon: '🔮' }` (line 24), rendering case `{logic.activeTab === 'insights' && <InsightsTab />}` (line 161) |
| `src/components/dashboard/ReportsTab-insights-wiring.test.tsx` | Created | 6 integration tests (menu presence, tab navigation, KPI rendering, empty state, store immutability) |

## Deviations from Design

1. **Task 1.9 — Shared extraction deferred**: `calculateStudentPeriodAverage` in `evolutionLogic.ts` uses identical weighting (simple area-DEF average), but extracting it into a shared utility would modify `evolutionLogic.ts` — out of scope for PR 1. Pattern duplicated in `insightsLogic.ts` with a note for future extraction.
2. **`detectArchetype` insufficient-data reason**: Spec says "reason MUST be `insufficient-data`" but `detectArchetype` returns `null` (not a partial `ArchetypeResult`) when < 2 periods exist. The null return is the signal; the hook filters nulls out.
3. **`aggregateInsights` function**: Design.md lists `aggregateInsights()` as an exported function from `insightsLogic.ts`, but it was not created in PR 1. Aggregation logic is implemented inline in `useInsights.ts` useMemo — this keeps the service pure and the hook as the integration point, matching the existing `useAnalysisPipeline` pattern.
4. **InsightsFilter co-location**: Filter component placed under `InsightsTab/InsightsFilter.tsx` (sub-component co-location) rather than as a standalone `src/components/dashboard/InsightsFilter.tsx`. This matches the `AnalysisTab/` sub-component pattern (FiltersBar, SubjectWeightsPanel, etc.).
5. **Task 5.1/5.2 file corrections**: Original tasks referenced `Header.tsx` and `MainLayout.tsx`, but the project uses a sub-tab system inside `ReportsTab.tsx` managed by `useUIStore.ts` (`reportsActiveTab`). The wiring was done in `ReportsTab.tsx` (lazy import, menu item, rendering case) and `src/domain/types.ts` (type union extension) — these are the correct integration points.

## Issues Found

1. **Spec scenario inconsistency for Radar**: The spec scenario "Stable low average without flags does NOT trigger Radar" uses `[2.8, 2.9, 2.7, 2.8]` with final=2.8 < 3.0. Per the Radar requirement (final < 3.0 IS a flag), this data SHOULD trigger Radar. Test adjusted to use `[3.5, 3.3, 3.4, 3.1]` where both conditions genuinely don't trigger.

## Workload / PR Boundary

- Mode: chained PR slice (feature-branch-chain)
- Current work unit: PR 3 — Tab Registration & Integration
- Boundary: PR 2 branch → this commit
- Estimated review budget impact (PR 3): ~30 lines changed (types.ts +1, ReportsTab.tsx +3, test file +170)
- Cumulative: ~930 lines across all 3 PRs

## Status

25/25 tasks complete across all 5 phases. **Ready for verify phase.**
