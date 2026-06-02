# Design: Academic Insights — Archetype Detection

## Technical Approach

Mirrors the `evolutionLogic.ts` → `useAnalysisPipeline` → `EvolutionTab.tsx` layered pattern:
pure service (`insightsLogic.ts`) → hook (`useInsights.ts`, `useMemo`-wired) → component (`InsightsTab.tsx`).

- `insightsLogic.ts` exports one function per archetype + a `detectArchetype()` orchestrator that runs all 4 and resolves tie-breaking (severity order: confiado > resiliente > montaña-rusa > radar).
- `useInsights.ts` reads `estudiantes` + `config` from `useDashboardStore`, calls `getEvaluatedPeriods()` + per-student period-averages (reusing `evolutionLogic.calculateStudentPeriodAverage` pattern), feeds into `detectArchetype()`, returns `ArchetypeResult[]` and aggregate counts. All via `useMemo` — zero store writes.
- `InsightsTab.tsx` renders a KPI row (4 archetype counts with severity colors), an archetype filter dropdown, and grouped `ArchetypeCard` components.

## Architecture Decisions

| # | Decision | Choice | Alternatives | Rationale |
|---|----------|--------|-------------|-----------|
| 1 | File naming | `insightsLogic.ts`, `useInsights.ts`, `InsightsTab.tsx` | `oracleLogic.ts`, `useOracle.ts` from proposal | User-directed: "insights" aligns with tab name and avoids unnecessary branding. |
| 2 | Archetype detection strategy | Sequential gates: monotonicity → delta check → threshold check. Each detector returns `ArchetypeResult | null`. | Single function with if-else chain | Sequential per-detector functions are independently testable; spec scenarios map 1:1. |
| 3 | Confidence scoring | Linear: `min(1.0, signal_strength / threshold)`. Signal = total swing for Confiado/Resiliente, largest swing for Montaña Rusa, flag count for Radar. | Binary (0 or 1) | Binary hides signal strength. Linear gives teachers meaningful differentiation (0.6 vs 0.95). |
| 4 | Period average calculation | Reuse `calculateStudentPeriodAverage` pattern from `evolutionLogic.ts` (area-level DEF average). | Build new per-student period calculator | Don't duplicate — extract if both need it, or import directly. EvolutionTab already proves correctness. |

## Data Flow

```
useDashboardStore.estudiantes[]
        │
        ├─→ getEvaluatedPeriods(config)
        │         │
        │         ▼
        │  { P1: true, P2: true, P3: false }
        │
        └─→ per-student period grades
             [4.8, 4.3, 3.9, null]     ← null periods excluded from detection
                  │
                  ▼
           detectArchetype(grades)
                  │
         ┌───────┼───────┬────────┐
         ▼       ▼       ▼        ▼
    confiado  resiliente  m.ru  radar
         │       │       │        │
         └───────┴───────┴────────┘
                  │
                  ▼
           ArchetypeResult (winner by severity)
                  │
                  ▼
         useInsights() useMemo → { results, counts }
                  │
                  ▼
         InsightsTab → KPI cards + ArchetypeCard[]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/services/insightsLogic.ts` | **Create** | Pure detectors: `detectConfiado`, `detectResiliente`, `detectMontanaRusa`, `detectRadar`, orchestrator `detectArchetype`, narrative generator `generateNarrative`, helper `calculateStudentPeriodAverages` |
| `src/domain/types.ts` | Modify | Add `PedagogicalArchetype`, `ArchetypeResult`, `InsightCounts` |
| `src/hooks/useInsights.ts` | **Create** | Reads store → calls insightsLogic → returns `{ results, counts, evaluatedPeriods }` via `useMemo` |
| `src/components/dashboard/InsightsTab.tsx` | **Create** | KPI row, filter dropdown, student card grid, empty state |
| `src/components/dashboard/InsightsTab/ArchetypeCard.tsx` | **Create** | Single student card: name, period-grade pills, archetype label, severity badge, narrative |
| `src/components/dashboard/InsightsTab/InsightsFilter.tsx` | **Create** | Dropdown: "Todos" + 4 archetype options |
| `src/components/layout/Header.tsx` | Modify | Add `{ name: 'Insights', tabs: [{ id: 'insights', label: 'Oracle Insights' }] }` to `tabGroups` |
| `src/components/layout/MainLayout.tsx` | Modify | Lazy import `InsightsTab`, add `case 'insights'` to `renderActiveTab` |

## Interfaces / Contracts

```typescript
// src/domain/types.ts (additions)

export type PedagogicalArchetype = 'confiado' | 'resiliente' | 'montana-rusa' | 'radar';
export type ArchetypeSeverity = 'high' | 'medium' | 'low';

export interface ArchetypeResult {
  estudianteId: string;
  estudianteName: string;
  grupo: string;
  archetype: PedagogicalArchetype;
  confidence: number;        // 0..1
  severity: ArchetypeSeverity;
  periodGrades: (number | null)[];  // trace for transparency
  narrative: string;         // Spanish pedagogical text
  reason?: string;           // null if no archetype matched
}

export interface InsightCounts {
  confiado: number;
  resiliente: number;
  'montana-rusa': number;
  radar: number;
  total: number;
}
```

```typescript
// src/services/insightsLogic.ts (signatures)

export function detectArchetype(periodGrades: (number | null)[]): ArchetypeResult | null;
export function aggregateInsights(results: (ArchetypeResult | null)[]): { results: ArchetypeResult[]; counts: InsightCounts };
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit — `insightsLogic.test.ts` | Each detector: threshold edges, monotonicity enforcement, insufficient data guard, confidence calculation, narrative generation | Pure vitest, table-driven inputs. Covers all 12 spec scenarios. |
| Unit — `useInsights.test.ts` | Hook returns correct results/counts from mock store data, handles empty estudiantes array, respects `useMemo` stability | `@testing-library/react-hooks` or renderHook, mock `useDashboardStore` |
| Component — `InsightsTab.test.tsx` | Renders KPI cards with correct counts, filter dropdown filters cards, empty state text when no results, store immutability assertion | `@testing-library/react` + `vitest-axe`. Mock `useInsights`. Assert `useDashboardStore.getState()` unchanged after render. |
| Component — `ArchetypeCard.test.tsx` | Renders student name, period grades as pills, severity color classes, narrative text | Render with mock `ArchetypeResult`, snapshot or role queries |

## Migration / Rollout

No migration required. New tab is additive — removing it (rollback) only requires reverting `MainLayout.tsx` lazy import + switch case and `Header.tsx` tab group entry. No store schema changes.

## Open Questions

- [ ] Should `calculateStudentPeriodAverage` be extracted from `evolutionLogic.ts` into a shared utility, or duplicated in `insightsLogic.ts`? (Prefer shared extraction if both use the same weighting — verify with `calcularPromedioActual`.)
- [ ] Severity thresholds for color coding: spec says "high/medium/low" but does not define cutoffs. Propose: high ≥ 0.7, medium ≥ 0.4, low < 0.4, pending team confirmation.
