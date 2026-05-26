# Design: Web Worker Excel Parser

## Technical Approach

Insert a Web Worker between `File` and the existing pure-function pipeline. The store delegates to `excelWorkerClient`, which creates a module worker, transfers the `ArrayBuffer` (zero-copy), and maps worker messages back to store state. No changes to `excelParser.ts` or `academicLogic.ts` — both are re-imported by the worker as-is.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|----------|--------|----------|-----------|
| Worker lifecycle | Singleton per `processFile()`, terminated on re-upload | Pool | Single-file-at-a-time upload; pool adds complexity with zero benefit |
| Always vs threshold | Always-use Worker | >5MB threshold | Single code path avoids dual-test maintenance; creation overhead <5ms negligible vs parsing |
| Progress granularity | 4 phases (`"Leyendo archivo..."`, `"Extrayendo estudiantes..."`, `"Calculando pesos..."`, `"Aplicando lógica académica..."`) | Per-row granularity | Balances UX feedback with postMessage overhead; Spanish matches app locale |
| Error strategy | Worker `try/catch` → structured `ERROR` postMessage | `self.onerror` only | `postMessage` errors survive structured clone across threads; Error objects don't |
| Transfer protocol | Zero-copy `ArrayBuffer` via transfer list | Copy | PostMessage structured clone would duplicate 15MB in memory |
| Vite config | None needed | — | Vite 8+ supports `new Worker(new URL(...), { type: 'module' })` natively; xlsx auto-bundled into worker chunk |

## Data Flow

```
File (Upload)
  │
  ▼
excelWorkerClient.parseFile(file)
  ├─ file.arrayBuffer() ──→ transfer via postMessage(buffer, [buffer])
  │
  ▼
excelWorker.ts (Web Worker)
  ├─ XLSX.read(buffer)
  ├─ validateWorkbook()      ──→ DIAGNOSTIC
  ├─ parseWorkbook()          ──→ PROGRESS
  ├─ inferSubjectWeights()    ──→ PROGRESS
  ├─ applyAcademicLogic()     ──→ PROGRESS
  ├─ flattenRows()            ──→ RESULT
  │
  ▼
excelWorkerClient (onmessage dispatch)
  ├─ DIAGNOSTIC  → store.set({ diagnosticReport })
  ├─ PROGRESS    → store.set({ parsingProgress })
  ├─ RESULT      → store.set({ estudiantes, rowsArea, ... loading: false })
  └─ ERROR       → store.set({ error, loading: false })
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/services/excelWorker.ts` | Create | Worker entry: imports pure functions, handles `onmessage`, posts typed messages |
| `src/services/excelWorkerClient.ts` | Create | Promise wrapper: `parseFile(file)` creates worker, maps messages, handles lifecycle |
| `src/services/workerTypes.ts` | Create | Type definitions: `WorkerMessage`, `WorkerRequest`, `WorkerProgress`, `ParsedExcelData` |
| `src/store/useDashboardStore.ts` | Modify | `processFile()` delegates to client; add `parsingProgress` state; terminate on re-upload |
| `src/store/useDashboardStore.test.ts` | Modify | Add `vi.mock` for `excelWorkerClient`; refactor `processFile` tests to use worker mock |

**Unchanged**: `excelParser.ts`, `academicLogic.ts`, `FileUploadArea.tsx` (consumes `loading` as before), `AnalysisTab.tsx`, `MainLayout.tsx`.

## Contracts

```typescript
// src/services/workerTypes.ts
export interface ParsedExcelData {
  estudiantes: Estudiante[];
  rowsArea: RowArea[];
  rowsAsignatura: RowAsignatura[];
  subjectWeights: SubjectWeightConfig;
  availableGroups: string[];
  diagnosticReport: DiagnosticReport;
}

export type WorkerMessage =
  | { type: 'PROGRESS'; phase: string; message: string }
  | { type: 'DIAGNOSTIC'; report: DiagnosticReport }
  | { type: 'RESULT'; data: ParsedExcelData }
  | { type: 'ERROR'; message: string; stack?: string };

export interface WorkerRequest {
  type: 'PARSE';
  fileData: ArrayBuffer;
  fileName: string;
}
```

**excelWorkerClient.ts** exports: `parseFile(file: File): Promise<ParsedExcelData>`, `terminateWorker(): void`.

## Store Changes

**Before** (`processFile`): inline `XLSX.read` → `validateWorkbook` → `parseWorkbook` → weight loop → `applyAcademicLogic` → `flattenRows` → `set()`.

**After**: Terminate previous worker if running → `set({ loading: true, parsingProgress: "Leyendo archivo..." })` → delegate to `excelWorkerClient.parseFile(file)`. The client dispatches progress/result/error to store callbacks. New state field: `parsingProgress: string | null` (null when idle).

Note: `setConfig()` and `updateSubjectWeight()` retain direct `applyAcademicLogic`/`flattenRows` imports for recalculation — only `processFile()` delegates to the worker. The store removes the `xlsx` import but keeps `flattenRows` and `applyAcademicLogic`.

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| `excelParser.test.ts` | Pure functions unchanged | Run as-is |
| `academicLogic.test.ts` | Pure functions unchanged | Run as-is |
| `excelWorker.ts` | Message dispatch, error catching | Separate vitest test; worker code is pure functions + event listener |
| `excelWorkerClient.ts` | Worker lifecycle, message mapping | Mocked via `vi.mock` in store tests |
| `useDashboardStore.test.ts` | `processFile()` delegates to client | Mock `excelWorkerClient`; assert store handles progress/result/error/disconnect |
| Integration | Full pipeline via worker | Manual: upload 15MB file, verify no UI freeze |

## Open Questions

None. All design decisions resolved per exploration and proposal.
