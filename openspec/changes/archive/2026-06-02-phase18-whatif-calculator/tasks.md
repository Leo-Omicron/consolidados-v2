# Implementation Tasks: What-If Calculator

- [x] Create `useSimulationStore` with `activeSimulations` state and mutators.
- [x] Add range validation (0 to 5.0) for simulation inputs.
- [x] Implement URL hash export/import via `lz-string`.
- [x] Create `simulationLogic.ts` with `getSimulatedRows` deep clone.
- [x] Update `academicLogic.ts` to accept and apply `activeSimulations` overrides before averaging.
- [x] Create `EditableGradeCell` React component.
- [x] Create `SimulationBanner` React component.
- [x] Integrate components into `AnalysisTab`.
- [x] Fix re-rendering performance when simulations change.
- [x] Write Vitest unit tests for the store and the core logic.
- [x] Route fallback subject overrides to area and auto-propagate grades (`ab334cb`).
- [x] Collapse diagnostics report by default and fix subtable simulation recalculations (`16f75ac`).