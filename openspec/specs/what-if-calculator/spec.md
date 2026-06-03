# Specification: What-If Calculator

## Core Requirements

1. **Non-Destructive Overrides**
   - The user must be able to change any specific subject grade for a student in a specific period (`P1`, `P2`, `P3`, `P4`).
   - Original data uploaded from the diagnostic Excel must remain immutable in `useDashboardStore`.
   - Simulated state must be tracked separately in `useSimulationStore`.

2. **Auto-Propagation**
   - When a simulated grade is set, the application must automatically recalculate:
     - The subject's final average (`definitiva`).
     - The corresponding Area average for that period.
     - The overall Area final average.
     - The student's overall year average.

3. **Data Integrity**
   - Inputs must be restricted to numerical values between `0.0` and `5.0`.
   - The system must clamp/round invalid input inputs natively.

4. **UI Indicators**
   - The `EditableGradeCell` must visually indicate whether it is displaying an original grade or an overridden grade.
   - The `AnalysisTab` must render a `SimulationBanner` when at least one simulation is active.
   - The banner must provide a "Reset All" action.

5. **Sharable Scenarios**
   - Active simulations must be exportable to a short, encoded URL hash (using `lz-string`).
   - The application must detect URL hashes on load and hydrate `useSimulationStore`.

## Architectural Boundaries
- `useSimulationStore.ts`: Holds `activeSimulations` (`Record<rowId, Partial<PeriodoNotas>>`).
- `simulationLogic.ts`: Houses `getSimulatedRows`, a pure function taking base `estudiantes` + `activeSimulations` + `config` -> returns calculated `rowsArea` and `rowsAsignatura`.
- `academicLogic.ts`: Was modified to accept the `activeSimulations` overrides.