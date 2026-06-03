# Design: What-If Calculator (Phase 18)

## Architecture

### State Management (`src/store/useSimulationStore.ts`)
- **State**: `activeSimulations` (`Record<string, Partial<PeriodoNotas>>`)
- **Actions**: `setSimulation`, `clearSimulation`, `clearAllSimulations`
- **Serialization**: `exportToHash`, `importFromHash` using `lz-string` for base64 encoding URL compatibility.

### Core Logic (`src/services/simulationLogic.ts`)
- Function `getSimulatedRows(estudiantes, activeSimulations, config, subjectWeights)`
- Must use `structuredClone` to copy the base `estudiantes` array.
- Injects simulations into the calculation pipeline inside `applyAcademicLogic`.

### UI Components
- **`EditableGradeCell`**: Input field that switches between read-only (original grade) and edit mode. Validates values between `0.0` and `5.0`.
- **`SimulationBanner`**: Sticky banner indicating active simulation mode.
- **`AnalysisTab` Integration**: Replaces standard grade cells with `EditableGradeCell`. Computes simulated rows if `activeSimulations` has keys.

## Data Flow
1. User edits a cell -> `setSimulation(rowId, period, value)`.
2. `AnalysisTab` detects state change.
3. Call `getSimulatedRows` -> deeply clones students -> updates specific grades -> recalculates area & final averages.
4. UI renders the simulated `rowsAsignatura` instead of the original ones.