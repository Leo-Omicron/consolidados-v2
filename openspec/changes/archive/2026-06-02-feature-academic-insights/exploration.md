# Exploration: The Oracle — Trend/Archetype Detection for Academic Insights

> **Feature**: Detect actionable pedagogical insights from grade trends across periods (P1→P2→P3), identifying students who are "at risk despite their average" or fit specific pedagogical archetypes.
>
> **Status**: Exploration complete — ready for proposal.

## Current State

The system already computes extensive academic data per student:

| Capability | Where | What it does |
|-----------|-------|--------------|
| **State classification** | `academicLogic.ts:determinarEstado()` | Labels each subject/area as Ganado, Ganable, Recuperable, En riesgo, Perdido based on weighted average and remaining periods |
| **Risk detection** | `reportEngine.ts:generateAcademicRiskReport()` | Identifies students with failed areas or mathematically impossible recovery |
| **Volatility profiles** | `VolatilityTab.tsx` | Classifies students as Estable, Ascenso, Caída Libre, Montaña Rusa based on variance and period-to-period diffs |
| **Trend calculation** | `useAnalysisPipeline.ts:augmentRows()` | Simple directional trend (up/down/flat) comparing first vs last available period |
| **Evolution tracking** | `evolutionLogic.ts` | Per-student and per-group period averages for charting |

**The gap**: The current system evaluates the *current state* (snapshot) but has no mechanism to detect *actionable trends* or *cross-student archetypes*. A student at 3.2 "En riesgo" is flagged, but a student at 4.8→3.8 with a current 4.3 average (still "Ganado") is invisible — even though the trend signals a critical intervention opportunity.

## Affected Areas

| File | Role | Impact |
|------|------|--------|
| `src/services/academicLogic.ts` | Academic calculations, constants | New archetype detection function(s) to add |
| `src/services/evolutionLogic.ts` | Period-to-period student evolution | Can be extended or consumed by archetype logic |
| `src/hooks/useAnalysisPipeline.ts` | Data pipeline for AnalysisTab | New hook or pipeline step for archetype enrichment |
| `src/domain/types.ts` | Type definitions | New `PedagogicalArchetype`, `ArchetypeResult`, `InsightReport` types |
| `src/store/useDashboardStore.ts` | Main dashboard store | Optional: archetype state if computed lazily |
| `src/components/layout/MainLayout.tsx` | Tab navigation | New `InsightsTab` registration |
| `src/components/layout/Header.tsx` | Header tab groups | New tab group or entry under "Seguimiento" |
| `src/components/dashboard/` | Tab components | New `InsightsTab.tsx` + sub-components |
| `src/services/reportEngine.ts` | Report generators | Optional integration point |
| `openspec/specs/` | Main specs | New domain spec for academic-insights |

## Archetype Definitions

The VolatilityTab already demonstrates trend classification but uses only variance/stddev logic. The Oracle needs **semantically named, mathematically precise archetypes** tied to pedagogical action.

### Proposed Archetypes

#### 1. El Confiado (The Complacent High-Flyer)

**Pattern**: Strong start, declining across periods.

| Rule | Condition | Rationale |
|------|-----------|-----------|
| Baseline | P1 ≥ 4.0 | Started strong |
| Trend | P1 > P2 > P3 with each drop ≥ 0.3 | Meaningful non-incidental decline |
| Current state | Current average ≥ 3.0 (still "passing") | **Key**: they look fine on paper |
| Minimum drop | P1 - P3 ≥ 0.8 total | Filters noise: 4.8→4.5 is NOT El Confiado |
| Severity variant | If P3 < 3.0 → "Confiado Crítico" | Has fallen below passing |

**False positive guard**: Students with P1=4.0, P2=4.0, P3=3.9 (drop of 0.1) are excluded by the 0.3 minimum period drop.

**Pedagogical action**: Teacher intervention before the student fails — the dashboard catches it early.

#### 2. El Resiliente (The Resilient Comeback)

**Pattern**: Starts weak, progressively improves.

| Rule | Condition | Rationale |
|------|-----------|-----------|
| Baseline | P1 ≤ 3.0 | Started at risk or below |
| Trend | P1 < P2 < P3 with each rise ≥ 0.3 | Consistent improvement |
| Current state | P3 ≥ 3.0 (now passing) | **Key**: they turned it around |
| Minimum rise | P3 - P1 ≥ 1.0 total | Meaningful recovery |

**False positive guard**: Students who improved from 2.9 to 3.1 (only 0.2) are excluded.

**Pedagogical action**: Positive reinforcement — the teacher can use this student as a peer mentor or example.

#### 3. La Montaña Rusa (The Inconsistent Performer)

**Pattern**: Unstable with sharp swings — both up and down.

| Rule | Condition | Rationale |
|------|-----------|-----------|
| Volatility | Period variance (stddev) ≥ 0.6 | Borrowed from VolatilityTab threshold |
| Swing magnitude | At least one period-to-period change ≥ 1.0 | Sharp swing |
| Not monotonic | NOT (P1<P2<P3 with ≥0.3) AND NOT (P1>P2>P3 with ≥0.3) | Must not be simply up or down |
| Current state | Any grade, but typically ≥ 3.0 | The volatility is the insight |

**False positive guard**: Students with grade variations within normal range (e.g., 3.5→3.7→3.6, stddev ~0.1) are excluded.

**Pedagogical action**: Investigate external factors — home situation, health, motivation, or inconsistent assessment criteria.

#### 4. El Radar (The Stealth Risk — currently passing but brittle)

**Pattern**: Average is fine, but fragile because of high dependency on remaining periods.

| Rule | Condition | Rationale |
|------|-----------|-----------|
| Current avg | PromedioActual ≥ 3.0 (passing) | Looks fine |
| But... | estado === 'En riesgo' | The math says they need ≥ 3.2 in remaining periods |
| OR | p4Min ≥ 3.5 for at least one area | High required grade to pass |
| AND | evaluados: P3 data exists | We know enough to judge |

**Note**: This student type currently *is* flagged by `determinarEstado()` as "En riesgo" — but the Archetype adds a *label and narrative* to make it actionable.

**False positive guard**: A student with estado "Ganado" mathematically is NOT El Radar, even if their trend looks negative.

### Summary Table

| Archetype | Trend Pattern | Grade Range | Priority | Detection Thresholds |
|-----------|--------------|-------------|----------|---------------------|
| **El Confiado** | P1 ≥ 4.0, declining ≥ 0.3 per period | P3 anywhere, avg ≥ 3.0 | ⚠️ High | Drop ≥ 0.3/period, total ≥ 0.8 |
| **El Resiliente** | P1 ≤ 3.0, rising ≥ 0.3 per period | P3 ≥ 3.0 | ✅ Low | Rise ≥ 0.3/period, total ≥ 1.0 |
| **Montaña Rusa** | High variance, swing ≥ 1.0 | Any | ⚡ Medium | Stddev ≥ 0.6, swing ≥ 1.0, non-monotonic |
| **El Radar** | Stable/any, estado "En riesgo" | ≥ 3.0 but fragile | ⚠️ High | Estado check + p4Min ≥ 3.5 |

### Missing Data Rules

| Scenario | Handling |
|----------|----------|
| Only P1 exists | → No archetype (insufficient data) |
| P1 + P2 exist, no P3 | → Compute partial archetype only for "El Radar" (state is valid); trend archetypes downgrade to "preview" with note |
| P1 + P3 exist (P2 missing) | → Still compute trend (skip period-to-period checks, use P1→P3 delta) |
| All periods null | → Skip student |

## Integration Architecture

### Approach Comparison

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **A. Pure service** — New `oracleLogic.ts` module with pure functions, consumed in a hook | Clean separation, testable, follows `academicLogic.ts` pattern, no store coupling | New file + hook import in tab | **Low** |
| **B. Extend `useAnalysisPipeline`** — Add archetype computation as a new step | Reuses existing pipeline machinery, memoized | Pollutes AnalysisTab concerns, couples archetypes to pipeline filters | **Med** |
| **C. Store-level computed property** — Compute in `useDashboardStore` alongside `applyAcademicLogic` | Available globally, all tabs can access | Store is already large; computed data would persist to IndexedDB (violating `partialize` contract) | **Med-High** |
| **D. Worker-based** — Compute archetypes in a Web Worker | Non-blocking for large datasets | Over-engineered — archetype computation is O(n) and trivial | **High** |

### Recommendation: Approach A — Pure Service + Standalone Hook

```
src/services/oracleLogic.ts    ← Pure functions (detectArchetypes, classifyArchetype)
src/hooks/useOracle.ts         ← React hook that reads from store + calls oracleLogic
src/components/dashboard/InsightsTab.tsx  ← UI component using useOracle
```

**Why this wins**:
- Follows the existing split: `evolutionLogic.ts` (pure) → consumed by `EvolutionTab.tsx`
- No store changes needed — the hook computes archetypes lazily via `useMemo`
- Archetypes are derived data, not persisted data (perfectly matches the `partialize` contract)
- Easy to test: `oracleLogic.test.ts` covers pure functions; `InsightsTab.test.tsx` covers UI

### Flow

```
Estudiante[]  →  getEvaluatedPeriods() + oracleLogic.detectArchetypes()  →  ArchetypeResult[]
                                                ↑
                                        config (PeriodConfig)
```

`detectArchetypes(student: Estudiante, config: PeriodConfig, evaluated: EvaluatedPeriods): ArchetypeResult` runs per-student and returns:

```typescript
interface ArchetypeResult {
  studentId: string;
  archetype: PedagogicalArchetype | null; // 'confiado' | 'resiliente' | 'montaña_rusa' | 'radar' | null
  severity: 'low' | 'medium' | 'high';
  confidence: number; // 0..1 — how well the student fits
  narrative: string;  // human-readable in Spanish
  metrics: {
    p1: number | null;
    p2: number | null;
    p3: number | null;
    currentAverage: number;
    trend: 'up' | 'down' | 'flat';
    stdDev?: number;
  };
}
```

## Risk & False Positives Analysis

| Risk | Scenario | Mitigation |
|------|----------|------------|
| **False alarm on minor fluctuations** | Student goes 4.8→4.5 (only 0.3 drop, still 4.5 - clearly fine) | Minimum threshold of ≥0.8 total drop AND ≥0.3 per-period. A 4.8→4.5 student fails both. |
| **Not enough data** | Only P1 available | `evaluated` parameter controls: need ≥2 periods for trend archetypes. Return `null` with no narrative. |
| **Edge: student improved then dropped** | 4.0→4.5→3.0 | This is NOT El Confiado (not monotonic). It IS Montaña Rusa (swing ≥1.0, high variance). Correct classification. |
| **Edge: student slowly declining** | 3.8→3.6→3.4 (consistent -0.2 each period) | Below the 0.3 per-period threshold. NOT El Confiado. But could be flagged as "mild concern" at low severity. |
| **Edge: student with 1.0→1.0→5.0** | Not monotonic improvement (flat for 2 periods, then up) | Not El Resiliente (must be monotonic). But it IS an interesting pattern — could be a separate subtype "Despertar Tardío" (late awakening). Not in v1. |
| **Grade inflation in all groups** | If all students show similar patterns, archetypes lose discriminatory power | Archetypes are absolute (rule-based), not relative (percentile-based). This is intentional — we want to flag *absolute* pedagogical concern. |
| **Confidence metric misleading** | A student barely meeting thresholds gets same label as extreme case | Severity system: `confidence` = 0..1 based on how far past thresholds the student is. A 4.0→3.2 has confidence ~0.5; a 5.0→2.0 has confidence ~1.0. |

## UI Implications

The existing UI architecture is tab-based with a dropdown navigation in the Header. The pattern for adding a new tab is well-established.

### Minimal High-Impact UI: `InsightsTab`

**Position**: New tab group "Insights" with a single tab "El Oráculo", placed between "Desempeño" and "Seguimiento" in the header.

**Layout** (minimal v1):

```
┌─────────────────────────────────────────────────┐
│  El Oráculo — Insights Pedagógicos              │
│  [Grupo: ___] [Arquetipo: Todos ▼]              │
├─────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│ │Confiado│ │Resiliente│ │Montaña │ │ Radar  │  │
│ │   X    │ │    Y    │ │   Z    │ │   W    │  │
│ └──────┘ └──────┘ └──────┘ └──────┘           │
├─────────────────────────────────────────────────┤
│                                                 │
│ Student cards grouped by archetype:             │
│                                                 │
│ ⚠️ El Confiado (3 resultados)                  │
│ ┌────────────────────────────────────────┐     │
│ │ Nombre  │ P1│ P2│ P3│ Prom │ Archetype  │     │
│ │ StudentA│5.0│4.2│3.1│ 4.1 │ 🔴 Crítico  │     │
│ │ StudentB│4.5│3.8│3.0│ 3.8 │ 🟡 Atención  │     │
│ └────────────────────────────────────────┘     │
│                                                 │
│ ✅ El Resiliente (2 resultados)                │
│ ┌────────────────────────────────────────┐     │
│ │ StudentC│1.5│2.8│4.5│ 2.9 │ 🟢 Bueno     │     │
│ └────────────────────────────────────────┘     │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Key UI decisions**:
1. **Aggregate KPIs row** at the top for each archetype count — matches the existing pattern in AlertsTab, VolatilityTab, and TutorsTab
2. **Archetype-grouped sections** — not flat list, so teachers can focus on the highest concern first
3. **Mini-trend sparkline** optional — keep v1 text-based with period grades
4. **Severity color coding** — red/amber/green per student card
5. **Click to expand** — card shows narrative and specific recommendation

**Not in v1** (to avoid overwhelm):
- No charts/graphs (EvolutionTab already does this)
- No PDF export (AlertsTab does this)
- No row-level inline editing
- No per-area or per-subject breakdown (just student-level archetype)

## Recommendation

**Proceed to Proposal with Approach A** — pure `oracleLogic.ts` service + `useOracle` hook + new `InsightsTab`.

| Aspect | Decision |
|--------|----------|
| Archetype count | **4** for v1 (Confiado, Resiliente, Montaña Rusa, Radar) |
| Data flow | Pure function → hook → component (no store changes) |
| Thresholds | Absolute, configurable in `oracleLogic.ts`, not hardcoded magic |
| Missing data | Return `null` archetype; short-circuit on < 2 periods for trend archetypes |
| Noise filtering | Minimum 0.3 per-period change, minimum 0.8 total delta |
| UI | New tab group "Insights" with KPIs + grouped student cards |
| Effort | **Medium** — ~1 session for oracleLogic + tests, ~1 session for UI |

## Risks

1. **Threshold calibration**: The initial thresholds (0.3 per-period drop, 0.8 total) are educated guesses. They need real-world validation. Consider adding a **visibility toggle** to show near-miss students (those within 80% of threshold) for teacher feedback.
2. **P4 handling**: The current config supports optional P4. Archetype detection uses only P1-P3 for trend detection. If P4 is the current period, P3→P4 should be the trend direction, but that needs `getEvaluatedPeriods` logic. Not in v1.
3. **Multiple archetypes per student**: A student could be both "En riesgo" (El Radar) AND declining (El Confiado). The detection function should return a **primary archetype** (highest severity wins) and optionally a secondary.
4. **Teacher trust**: A dashboard that labels students needs to be clear about its confidence. Every archetype card MUST show the reasoning (period grades, thresholds met) so teachers can verify.

## Ready for Proposal

**Yes**. The exploration has identified:
- Clear archetype definitions with mathematical thresholds
- A clean integration path following existing patterns
- False-positive mitigations for every edge case
- A minimal UI that provides high impact without overwhelming users

The orchestrator should tell the user: "Exploration complete — 4 archetypes defined, Approach A (pure service + hook) recommended, false-positive guards documented, minimal UI sketched. Ready for proposal phase."
