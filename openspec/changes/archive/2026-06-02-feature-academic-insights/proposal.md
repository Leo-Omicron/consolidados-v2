# Proposal: The Oracle — Academic Insights (Archetype Detection)

## Intent

Detect hidden pedagogical risks and positive efforts from grade trends that the current snapshot-based system misses. A student declining from 4.8→3.8 with a 4.3 average looks "fine" today but needs intervention. The Oracle surfaces these patterns as actionable archetypes.

## Scope

### In Scope
- Pure logic service `src/services/oracleLogic.ts` — 4 archetype detectors (El Confiado, El Resiliente, Montaña Rusa, El Radar) with confidence scoring (0..1), severity labels, and Spanish-language narrative generation
- Integration hook `src/hooks/useOracle.ts` — computes archetypes via `useMemo` from existing `estudiantes` + `getEvaluatedPeriods()`, no store mutation
- New `InsightsTab.tsx` — aggregate KPI row (4 archetype counts), archetype-grouped student cards with period grades, severity color coding, group filter dropdown
- New types in `src/domain/types.ts` — `PedagogicalArchetype`, `ArchetypeResult`, `InsightReport`
- Tab registration in `Header.tsx` (new "Insights" group) and `MainLayout.tsx` (lazy import + switch case)

### Out of Scope
- Charts, graphs, sparklines (EvolutionTab handles visualization)
- PDF/Excel export of insights
- Per-area or per-subject archetype breakdown
- P4 trend integration
- "Near-miss" students (80% of threshold) toggle

## Capabilities

### New Capabilities
- `academic-insights`: Detect 4 pedagogical archetypes from per-student period grade trends with false-positive guards (min 0.3/period delta, min 0.8 total delta, monotonic enforcement, missing-data short-circuit) and produce confidence-scored, severity-labeled, Spanish-narrative insight cards

### Modified Capabilities
- None — new capability following existing patterns, no spec-level changes to `dashboard-state` or `academic-constants`

## Approach

**Pure Service + Standalone Hook** (matches `evolutionLogic.ts` → `EvolutionTab.tsx` pattern):

```
estudiantes[] → getEvaluatedPeriods() + oracleLogic.detectArchetypes() → ArchetypeResult[]
                      ↑
              config (PeriodConfig)
```

Each student's area-level DEF grades feed per-period averages. `detectArchetypes()` runs per student and returns one `ArchetypeResult` with primary archetype (highest severity wins), confidence (0..1), period-grade trace, and pedagogical narrative. The hook calls this via `useMemo`, consuming nothing but existing store data. Zero store changes — archetypes are derived, not persisted (respects `partialize` contract).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/services/oracleLogic.ts` | **New** | Pure archetype detection functions |
| `src/domain/types.ts` | Modified | Add `PedagogicalArchetype`, `ArchetypeResult`, `InsightReport` |
| `src/hooks/useOracle.ts` | **New** | React hook: reads store, calls oracleLogic, memoized |
| `src/components/dashboard/InsightsTab.tsx` | **New** | UI: KPI cards + grouped student cards |
| `src/components/layout/Header.tsx` | Modified | Add "Insights" tab group |
| `src/components/layout/MainLayout.tsx` | Modified | Lazy import + switch case for insights tab |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Threshold calibration wrong for real data | Medium | Constants in `oracleLogic.ts` (not magic), easy to tune post-deploy |
| Multiple archetypes per student (e.g., Confiado + Radar) | Low | Primary archetype by severity; secondary logged for future iteration |
| Teacher distrust of algorithm | Medium | Every card shows period grades + thresholds met; confidence score visible |

## Rollback Plan

Remove `InsightsTab` lazy import and switch case from `MainLayout.tsx`, remove "Insights" group from `Header.tsx`, delete `oracleLogic.ts`, `useOracle.ts`, `InsightsTab.tsx`. No store or existing tab behavior affected.

## Dependencies

- `academicLogic.getEvaluatedPeriods()` — already exists
- `academicLogic.PASSING_GRADE` — already exists
- `calcularPromedioActual()` — for per-period student averages

## Success Criteria

- [ ] All 4 archetypes detected correctly on test dataset (≥90% accuracy vs manual classification)
- [ ] Unit tests for `oracleLogic.ts` cover noise filtering (minor fluctuations excluded), missing-data short-circuit (<2 periods → null), edge cases (non-monotonic, swing within threshold)
- [ ] `InsightsTab` renders without mutating `useDashboardStore`
- [ ] Zero TypeScript errors, existing test suite green (`npx vitest run`)
