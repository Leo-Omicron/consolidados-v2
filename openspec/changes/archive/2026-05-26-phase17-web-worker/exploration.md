## Exploration: phase17-web-worker

### Current State

The file processing pipeline lives entirely on the main thread inside `useDashboardStore.processFile()`. The flow is:

```
File (drag/drop)
  → file.arrayBuffer()                                 [main thread, ~10-50ms for 15MB]
  → XLSX.read(data, { type: 'array' })                 [main thread, ~200-800ms for 15MB]
  → validateWorkbook(workbook)                          [main thread, ~10-50ms]
  → parseWorkbook(workbook, curso) → Estudiante[]       [main thread, ~50-200ms]
  → inferSubjectWeights() per group                     [main thread, ~100-500ms with grid search]
  → applyAcademicLogic(students, config, weights)       [main thread, ~10-30ms]
  → flattenRows(students) → rowsArea, rowsAsignatura    [main thread, ~5-10ms]
  → set({ loading: false, ...state })
```

The parser (`src/services/excelParser.ts`, 428 lines) is entirely **pure functions** — no DOM, no `window`, no side effects. Every function takes data in and returns data out. This makes it **trivially movable to a Web Worker**.

The store (`useDashboardStore.ts`, 164 lines) has:
- `loading: boolean` — consumed only by `FileUploadArea.tsx` (disables button + shows spinner)
- `error: string | null` — rendered as error banner
- `diagnosticReport` — result of phase16 validation, rendered as accordion in `FileUploadArea.tsx`
- `processFile()` — the only function that orchestrates parsing

`academicLogic.ts` (333 lines) is also pure functions — no DOM dependency.

### Affected Areas

| File | Why Affected |
|------|-------------|
| `src/services/excelParser.ts` | **NOT changed** — functions remain pure, re-used by worker |
| `src/services/academicLogic.ts` | **NOT changed** — pure functions, re-used by worker |
| `src/workers/excelWorker.ts` | **NEW** — Web Worker entry point, imports excelParser + academicLogic |
| `src/services/excelWorkerClient.ts` | **NEW** — Thin wrapper that creates worker, postMessage, returns promise |
| `src/store/useDashboardStore.ts` | `processFile()` uses worker client instead of direct calls |
| `src/components/dashboard/FileUploadArea.tsx` | Minor: optionally show progress message from worker |
| `src/store/useDashboardStore.test.ts` | Mock `excelWorkerClient` instead of `excelParser` directly |
| `src/services/excelParser.test.ts` | **NOT changed** — unit tests for pure functions unaffected |
| `src/services/workerComms.ts` | **NEW** (optional) — typed message protocol types |

### Approaches

1. **Always use Worker (RECOMMENDED)**
   - **Description**: Create a worker for every file, regardless of size. The worker receives the `ArrayBuffer` via `postMessage` (transferable), runs the full pipeline, posts the result back.
   - **Pros**:
     - Single code path — no branching, simpler to test and maintain
     - Worker creation overhead is ~1-5ms, negligible vs parsing time
     - Consistent UX — UI never freezes, even for small files
     - Future-proof if files get larger
     - Progress messages possible (worker can `postMessage({ type: 'progress', message: '...' })`)
   - **Cons**:
     - Slightly more code complexity (message protocol, serialization)
     - Must ensure `xlsx` library bundles correctly in worker context (Vite handles this)
     - Test setup is slightly different (can't import worker functions directly in jsdom)
   - **Effort**: Medium

2. **Worker only for large files (>5MB threshold)**
   - **Description**: Check file.size before processing. If >5MB, use worker. If <=5MB, use current direct path.
   - **Pros**:
     - Zero overhead for small files (though overhead is already negligible)
     - Conservative — only changes behavior when necessary
   - **Cons**:
     - **Two code paths** to maintain and test
     - The threshold is arbitrary — a 4MB file with complex sheets can still freeze briefly
     - Harder to reason about bugs (which path was taken?)
     - No benefit from progress reporting on small files
   - **Effort**: High (dual code paths, dual tests, dual maintenance)

3. **Worker with SharedArrayBuffer + Atomics**
   - **Description**: Use SharedArrayBuffer to share memory between threads for true streaming parsing.
   - **Pros**:
     - Theoretically lower memory usage
     - Could support cancellation mid-parse
   - **Cons**:
     - **Overkill** — postMessage with structured clone is fast enough. Excel files are <20MB, the structured clone of the result JSON is the bottleneck, not the ArrayBuffer transfer.
     - SharedArrayBuffer requires specific HTTP headers (`Cross-Origin-Opener-Policy`, `Cross-Origin-Embedder-Policy`) which conflicts with many hosting setups (including Vercel in this project's case)
     - Significant complexity increase for marginal gain
   - **Effort**: Very High (not worth it)

### Data Flow: Worker Message Protocol

```
Main Thread                          Worker
────────────                         ──────
postMessage({
  type: 'PARSE',
  payload: { buffer, fileName }
})
  ─────────────────────────────────►  XLSX.read(buffer)
                                      validateWorkbook(workbook)
                                      if (!isValid)
                                        postMessage({ type: 'DIAGNOSTIC', payload: report })
                                        return
                                      postMessage({ type: 'PROGRESS', message: 'Parsing sheets...' })
                                      parseWorkbook(workbook, fileName)
                                      inferSubjectWeights(students)
                                      applyAcademicLogic(students, config)
                                      flattenRows(students)
                                      postMessage({
                                        type: 'RESULT',
                                        payload: {
                                          estudiantes, rowsArea, rowsAsignatura,
                                          subjectWeights, availableGroups, diagnosticReport
                                        }
                                      })
  ◄─────────────────────────────────

Worker error → catch(error) → postMessage({ type: 'ERROR', message: error.toString() })
```

### Recommendation

**Approach 1: Always use Worker** — the clear winner.

Rationale:
1. **Single code path** is easier to maintain and test than branching on file size
2. **Worker creation overhead** (~1-5ms + ~100ms for module loading on first use) is negligible compared to parsing a 15MB file (~500ms-1.5s)
3. **First load** is cached by the browser — subsequent worker creation is instant
4. **Progress reporting** becomes trivially easy to add (`postMessage({ type: 'progress' })`)
5. **The entire parser is pure functions** — they serialize perfectly, no DOM/window dependency
6. **Error isolation** — if the worker crashes, the main thread stays responsive. We can fall back gracefully.
7. **Vite handles this natively** with `new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })` and handles bundling `xlsx` into the worker chunk automatically.

### Implementation Sketch

**New file `src/workers/excelWorker.ts`:**
```typescript
import * as XLSX from 'xlsx';
import { validateWorkbook, parseWorkbook } from '../services/excelParser';
import { inferSubjectWeights, applyAcademicLogic } from '../services/academicLogic';
import { flattenRows } from '../services/excelParser';

self.onmessage = (e: MessageEvent) => {
  const { buffer, fileName } = e.data;
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const report = validateWorkbook(workbook);
    if (!report.isValid) {
      self.postMessage({ type: 'DIAGNOSTIC', payload: report });
      return;
    }
    const curso = fileName.replace(/\.[^/.]+$/, '');
    const students = parseWorkbook(workbook, curso);
    // ... inference, logic, flatten ...
    self.postMessage({ type: 'RESULT', payload: { ... } }, [buffer]);
  } catch (err) {
    self.postMessage({ type: 'ERROR', message: String(err) });
  }
};
```

**New file `src/services/excelWorkerClient.ts`:**
```typescript
export function parseFileInWorker(file: File): Promise<WorkerResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../workers/excelWorker.ts', import.meta.url),
      { type: 'module' }
    );
    worker.onmessage = (e) => {
      if (e.data.type === 'RESULT') resolve(e.data.payload);
      if (e.data.type === 'DIAGNOSTIC') resolve({ diagnosticReport: e.data.payload, ... });
      if (e.data.type === 'ERROR') reject(new Error(e.data.message));
    };
    worker.onerror = (err) => reject(err);
    file.arrayBuffer().then(buffer => {
      worker.postMessage({ buffer, fileName: file.name }, [buffer]);
    });
  });
}
```

**Modified `src/store/useDashboardStore.ts` `processFile()`:**
```typescript
processFile: async (file: File) => {
  set({ loading: true, error: null, diagnosticReport: null });
  try {
    const result = await parseFileInWorker(file);
    // Check for diagnostic report
    if ('diagnosticReport' in result && !result.diagnosticReport.isValid) {
      set({ loading: false, diagnosticReport: result.diagnosticReport, error: ... });
      return;
    }
    set({ ...result, loading: false });
  } catch (err) {
    set({ loading: false, error: String(err) });
  }
}
```

### Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `xlsx` fails to bundle in worker chunk | Low | Vite handles module workers natively; `xlsx` provides both CJS and ESM (`xlsx.mjs`) entry points. Test with `npm run build` early. |
| Worker fails to load (old browser) | Very Low | Add fallback: if `Worker` constructor throws, fall back to direct parsing. All modern browsers support module workers. |
| Structured clone of large result freezes briefly | Low | The result is JSON (~1-500KB for typical data). Structured clone time is <10ms even for large datasets. |
| Error message lost in `onerror` vs `onmessage` | Low | Always `try/catch` inside worker and post error as message. Use `worker.onerror` as last-resort only. |
| Tests need different setup | Medium | Worker code can't be imported directly in jsdom. Solution: test the worker's **logic** separately (the pure functions are already tested). Test the worker **wrapper** with mocks. Vitest supports `vi.mock` for worker imports. |
| Types: `PeriodConfig` needed in worker for `applyAcademicLogic` | Low | Store `config` snapshot and pass it with the initial message, or read from Zustand at call time. Simpler: pass `config` as part of the worker message payload. |

### Estimated Impact

| Category | Total |
|----------|-------|
| **New files** | 2 (`src/workers/excelWorker.ts`, `src/services/excelWorkerClient.ts`) |
| **Modified files** | 1 (`src/store/useDashboardStore.ts`) |
| **Test files changed** | 1 (`src/store/useDashboardStore.test.ts` — update mocks) |
| **Lines added** | ~120-150 (worker + client + store changes) |
| **Lines removed** | ~0 (existing direct parse code stays as fallback or is refactored) |
| **Components changed** | 1 (`FileUploadArea.tsx` — optional progress message display) |

### Ready for Proposal

Yes — Feasibility confirmed, architecture is clear. The pure-function parser design was already well-prepared for this extraction. Ready for `sdd-propose`.

### Key Learnings

- `excelParser.ts` is already modular pure functions — no refactoring needed to extract parsing logic into a worker. The entire `parseWorkbook` → `validateWorkbook` → `flattenRows` chain is side-effect-free.
- `academicLogic.ts` is also pure — `applyAcademicLogic` mutates `Estudiante` objects in place, but that's fine in the worker since the worker owns the objects entirely and sends a structured clone back.
- `xlsx@0.18.5` provides both `xlsx.js` (CJS) and `xlsx.mjs` (ESM). Vite will bundle whichever it needs for the worker context.
- `tsconfig.app.json` uses `"moduleResolution": "bundler"` and `"target": "es2023"` — compatible with Vite's worker bundling.
- No existing worker patterns exist in the codebase (grep for "worker" returned 0 results in `src/`).
- The `loading` boolean is consumed **only** by `FileUploadArea.tsx` — no other component checks it.
- The UI has **no progress reporting** currently — it's a binary spinner. The worker opens the door for `{ type: 'PROGRESS', message: 'Leyendo hoja 3 de 5...' }` messages.
- `inferSubjectWeights()` with its 0.01-step grid search (for up to 3 subjects) runs on the main thread and could be the heaviest non-XLSX-read operation (~100-500ms). Moving it to the worker is a clear win.
