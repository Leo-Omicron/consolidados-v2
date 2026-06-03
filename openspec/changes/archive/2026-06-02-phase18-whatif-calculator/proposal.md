# Proposal: What-If Calculator (Phase 18)

## Intent
Allow users to simulate grade overrides directly on the dashboard to foresee their impact on final averages, without mutating the original diagnostic data.

## Context
Teachers and coordinators often ask "What if this student scores a 4.5 in P4?". Currently, they have to manipulate the raw Excel file and re-upload it. We need a fast, client-side, non-destructive way to simulate grades and auto-propagate those overrides to Area averages and the final year grade.

## Proposed Approach
- Create a `useSimulationStore` to track `activeSimulations` keyed by `rowId`.
- Intercept rendering in `AnalysisTab` using an `EditableGradeCell` for the periods.
- Calculate derived values using a pure function `getSimulatedRows` in `simulationLogic.ts` that deeply clones students, applies the overrides, and runs the standard `applyAcademicLogic`.
- Provide a `SimulationBanner` to warn users when they are viewing simulated data, offering a global "Reset" button.
- Add import/export via `lz-string` URL hashes to share simulation scenarios.
