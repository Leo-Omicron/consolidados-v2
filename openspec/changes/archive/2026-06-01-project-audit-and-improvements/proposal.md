# Proposal: Critical Bugs & Technical Debt Remediation

## Intent

Fix the highest-severity bugs and architectural debt identified in the project audit before they cause runtime failures, data issues, or make the codebase unmaintainable. The `AnalysisTab` monolith and `useEffect` anti-patterns are the most urgent items — they directly risk render correctness and team velocity.

## Scope

### In Scope
- **A1** — Decompose `AnalysisTab.tsx` (675 lines) into focused sub-components
- **A2** — Fix `useEffect` mutating global state in `VolatilityTab` and `TutorsTab`
- **A3/A10** — Extract `PASSING_GRADE` constant, eliminate hardcoded `3.0` in ~8 locations
- **A4** — De-duplicate period-evaluation detection logic across 3 files
- **A5** — Remove `estudiantes` from Zustand IndexedDB persistence (performance + storage risk)
- **A12** — Create `openspec/config.yaml` to complete SDD workflow structure

### Out of Scope
- **UI/UX improvements** (U1-U8): `lang="es"`, aria-labels, skeleton loading, config error handling — deferred to a separate change
- **Testing improvements** (T1-T5): `evolutionLogic.ts` coverage, E2E tests — deferred
- **Low-severity tech debt** (A6-A9, A11): Worker reuse, inline styles, CSS redundancy, toFixed precision, JSON deep clone — deferred
- **New features** (dashboard customization, multi-year history, PDF export)

## Capabilities

### New Capabilities
- `academic-constants`: Centralized shared constants (`PASSING_GRADE`, period logic) consumed by services and UI

### Modified Capabilities
None. Existing specs (`web-worker-parser`, `excel-diagnostics`) are not affected by this change.

## Approach

Refactor in dependency order — fix shared logic first, then consume it in components:

1. **Constants & dedup first** — Extract `PASSING_GRADE` + period detection into shared modules. Update all ~8 hardcoded `3.0` sites and 3 duplicated period-detection sites to use the new modules.
2. **State bug fix** — Replace `useEffect` + `setGlobalGroup` in `VolatilityTab`/`TutorsTab` with derived state or event-driven updates (no global mutation from render).
3. **Monolith decomposition** — Split `AnalysisTab` into sub-components (filters, table, simulation, area-expansion) extracting each into its own file under `src/components/dashboard/analysis/`.
4. **Storage fix** — Remove `estudiantes` from Zustand persist config. The store already holds derived analysis results — raw student data belongs in memory only.
5. **Config bootstrap** — Create `openspec/config.yaml` with project metadata and SDD defaults.

All existing 270+ tests must pass after each step. Add regression tests for the useEffect fix and constant extraction.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/services/academicLogic.ts` | Modified | Extract shared constants + de-duplicate period detection |
| `src/services/reportEngine.ts` | Modified | Replace hardcoded `3.0` with shared constant |
| `src/components/dashboard/AnalysisTab.tsx` | Split into 3-4 files | Monolith → sub-components under `analysis/` |
| `src/components/dashboard/VolatilityTab.tsx` | Modified | Remove `useEffect` global state mutation |
| `src/components/dashboard/TutorsTab.tsx` | Modified | Remove `useEffect` global state mutation |
| `src/store/useDashboardStore.ts` | Modified | Stop persisting `estudiantes` in IndexedDB |
| `src/components/dashboard/SummaryTab.tsx` | Modified | Replace hardcoded `3.0` |
| `src/components/dashboard/KPIs` | Modified | Replace hardcoded `3.0` |
| `src/hooks/useReportsLogic.ts` | Modified | Use shared period-detection module |
| `openspec/config.yaml` | New | SDD workflow configuration |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| AnalysisTab refactor breaks simulation state | Medium | Preserve state structure; add simulation-specific regression tests |
| useEffect removal changes timing behavior | Low | Derived state is synchronous — test with React Testing Library |
| Constant extraction misses a hardcoded site | Low | Grep for `3\.0` across codebase; every match must be intentional or replaced |
| IndexedDB removal breaks reload flow | Low | Verify reload with existing test suite; derived data comes from pipeline, not raw estudiantes |

## Rollback Plan

Each step is self-contained and committable independently. If any step causes regression:
1. Revert the offending commit
2. All preceding commits remain valid and deployed
3. Re-approach the failing step with additional test coverage before re-applying

## Dependencies

- Existing test suite (270+ tests) must be passing before work begins
- No external dependencies

## Success Criteria

- [ ] `AnalysisTab.tsx` is under 200 lines, delegating to sub-components
- [ ] `VolatilityTab` and `TutorsTab` no longer call `setGlobalGroup` inside `useEffect`
- [ ] All hardcoded `3.0` values replaced with `PASSING_GRADE` constant (grep confirms zero false positives)
- [ ] Period-evaluation logic lives in a single shared module consumed by all 3 sites
- [ ] `estudiantes` is NOT present in Zustand persist whitelist; app reloads correctly with derived data
- [ ] `openspec/config.yaml` exists with valid schema
- [ ] All 270+ existing tests pass; new tests added for refactored modules
- [ ] No regression in academic calculations (averages, states, inferred weights)
