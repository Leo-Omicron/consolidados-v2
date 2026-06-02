# Tasks: Academic Insights — Archetype Detection

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~565 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Foundation) → PR 2 (UI) → PR 3 (Wiring) |
| Delivery strategy | auto-forecast |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units (feature-branch-chain)

| Unit | Goal | Likely PR | Base Branch | Notes |
|------|------|-----------|-------------|-------|
| 1 | Core logic + types + unit tests | PR 1 | `feature/academic-insights` | Pure service, self-verifiable via tests |
| 2 | Hook + components + component tests | PR 2 | PR 1 branch | UI layer on verified logic |
| 3 | Tab registration + integration | PR 3 | PR 2 branch | Minimal wiring, last-mile smoke test |

## Phase 1: Foundation — Types & Core Logic (PR 1)

- [x] 1.1 Add `PedagogicalArchetype`, `ArchetypeResult`, `InsightCounts` to `src/domain/types.ts`
- [x] 1.2 Create `src/services/insightsLogic.ts` with `detectConfiado(periodGrades)`
- [x] 1.3 Add `detectResiliente(periodGrades)` detector
- [x] 1.4 Add `detectMontanaRusa(periodGrades)` detector
- [x] 1.5 Add `detectRadar(noGrades)` fallback detector
- [x] 1.6 Add `detectArchetype(periodGrades)` orchestrator (severity tie-break: confiado > resiliente > montaña-rusa > radar)
- [x] 1.7 Add `generateNarrative(archetype, confidence, periodGrades)` — Spanish text
- [x] 1.8 Add `calculateStudentPeriodAverages(estudiante)` — reuse evolutionLogic pattern
- [x] 1.9 Extract shared `calculateStudentPeriodAverage` from `evolutionLogic.ts` if identical weighting confirmed

## Phase 2: Foundation Tests (PR 1)

- [x] 2.1 Write `insightsLogic.test.ts` — Confiado: sustained decline, minor fluctuation, non-monotonic
- [x] 2.2 Resiliente: sustained rise, small improvement, non-monotonic
- [x] 2.3 Montaña Rusa: alternating grades, smooth monotonic (no match)
- [x] 2.4 Radar: final failing grade, stable low without flags → null
- [x] 2.5 Insufficient-data guard: single period → null + reason, two periods → proceeds
- [x] 2.6 Tie-break integration: multiple archetypes match → correct winner by severity

## Phase 3: Hook & UI Components (PR 2)

- [x] 3.1 Create `src/hooks/useInsights.ts` — reads store, calls `getEvaluatedPeriods` + `detectArchetype`, returns `{ results, counts, evaluatedPeriods }` via useMemo
- [x] 3.2 Create `src/components/dashboard/InsightsTab/InsightsFilter.tsx` — dropdown with "Todos" + 4 archetypes
- [x] 3.3 Create `src/components/dashboard/InsightsTab/ArchetypeCard.tsx` — name, period-grade pills, archetype label, severity badge, narrative text
- [x] 3.4 Create `src/components/dashboard/InsightsTab.tsx` — KPI row, filter dropdown, grouped ArchetypeCard grid, empty state

## Phase 4: Component Tests (PR 2)

- [x] 4.1 Write `useInsights.test.ts` — mock store, verify results/counts, empty estudiantes, useMemo stability
- [x] 4.2 Write `ArchetypeCard.test.tsx` — renders name, pills, severity color classes, narrative
- [x] 4.3 Write `InsightsTab.test.tsx` — KPI cards, filter filters cards, empty state text, store NOT mutated on mount

## Phase 5: Tab Registration & Integration (PR 3)

- [x] 5.1 Modify `src/components/dashboard/ReportsTab.tsx` — add `InsightsTab` lazy import with `startTransition` wiring, add `{ id: 'insights', label: 'Oracle Insights', icon: '🔮' }` to menuItems. (Note: project uses ReportsTab sub-tab system, not Header.tsx/MainLayout.tsx as originally listed.)
- [x] 5.2 Add rendering case `{logic.activeTab === 'insights' && <InsightsTab />}` inside Suspense block in `ReportsTab.tsx`. Add `'insights'` to `ReportCategory` union type in `src/domain/types.ts`.
- [x] 5.3 Full integration verification: `npx vitest run` → 420 tests green (36 files), InsightsTab renders within ReportsTab via lazy loading, archetypes compute on real store data, no TS errors, store immutability preserved.
