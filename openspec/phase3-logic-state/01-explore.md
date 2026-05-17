## Exploration: Phase 3 (Logic and State)

### Current State
In the legacy implementation (`consolidados/index.html`), the Excel parsing logic was embedded inside the React components (`UploadView`) and grouped into objects like `profilingLogic`, `cleaningLogic`, and `calculationLogic`.
1. **XLSX.js** reads the file into an ArrayBuffer and converts each sheet into a 2D array (`sheet_to_json({ header: 1 })`).
2. **Headers** occupy the first 3 rows. The logic forward-fills missing area and asignatura cells (merged cells) and establishes a mapping for `P1`, `P2`, `P3`, `DEF`.
3. **Cleaning** iterates through data rows, sanitizes strings, converts valid notes to floats between 0 and 5, maps them into a nested object `Estudiante > Area > Asignatura`, and derives missing DEFs for unit areas.
4. **Calculations** compute `promedioActual`, `p4Min` (for 3-period system), and assign an `estado` (Perdido, En riesgo, Recuperable, Ganable, Ganado).

### Affected Areas
- `src/services/excelParser.ts` (New) — Service to handle FileReader and XLSX parsing cleanly.
- `src/services/academicLogic.ts` (New) — Service to calculate `promedioActual`, next period minimum, and academic status, adaptable to 3 or 4 periods.
- `src/store/useDashboardStore.ts` (New) — Zustand store to keep the parsed entities.
- `src/domain/types.ts` (Existing) — Ensure types support 4 periods.

### Approaches

#### 1. Excel Parsing Service
1. **Monolithic Parser**: Keep all parsing, cleaning, and calculation in one massive function.
   - Pros: Simple to port from legacy.
   - Cons: Hard to test individual parts (headers vs data vs math).
   - Effort: Low
2. **Modular Parser Pipeline (Recommended)**: Split into separate pure functions: `parseHeaders(raw)`, `extractStudents(data, headers)`, `applyAcademicLogic(students)`, and `flattenRows(students)`.
   - Pros: Highly testable. Easy to adjust for 3-period vs 4-period logic.
   - Cons: Slightly more boilerplate.
   - Effort: Medium

#### 2. State Management
1. **Context API**: React Context holding the data.
   - Pros: Built-in.
   - Cons: Re-renders the whole tree when large data changes. No built-in devtools.
   - Effort: Low
2. **Zustand Store (Recommended)**: Global atomic store holding `estudiantes`, `rowsArea`, and `rowsAsignatura`.
   - Pros: Performance optimized, no Context providers needed, minimal boilerplate, out-of-the-box devtools.
   - Cons: External dependency (already chosen).
   - Effort: Low

#### 3. 3-Period vs 4-Period Logic
- **Dynamic Period Detection (Recommended)**: During header parsing, detect if `P4` exists. Pass `totalPeriods` (3 or 4) to the calculation logic. The `promedioActual` divides by `totalPeriods`. The required minimum for the next period adapts to `(totalPeriods * 3.0) - sum`. 

### Recommendation
1. **Modular Parser**: Create `src/services/excelParser.ts` containing the pipeline, using `XLSX` to read.
2. **Dynamic Academic Logic**: Extract `calcPromYMin` into a highly tested module `src/services/academicLogic.ts` that dynamically counts periods based on the headers found.
3. **Zustand Store**: Define `useDashboardStore` with a `processFile(file: File)` async action that orchestrates the service calls and updates the state.

### Risks
- Large files freezing the UI during parsing. We might need a Web Worker later if files grow >15MB, but for now, extracting logic to a pure service will make migrating to a worker trivial.
- Period logic edge cases (e.g. some courses have 3 periods, others 4). The parser must determine periods per sheet or file.

### Ready for Proposal
Yes. We have a clear architectural plan for the services, logic, and state.