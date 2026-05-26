# Proposal: Web Worker Excel Parser

## Intent

Large Excel files (5-15MB) freeze the UI during parsing because the entire pipeline — `XLSX.read`, `validateWorkbook`, `parseWorkbook`, `inferSubjectWeights` (grid search), `applyAcademicLogic`, `flattenRows` — runs synchronously on the main thread. This change extracts that pipeline into a Web Worker so the UI stays responsive regardless of file size.

## Scope

### In Scope
- New `src/workers/excelWorker.ts` — Web Worker entry point that imports and runs the full parsing pipeline
- New `src/services/excelWorkerClient.ts` — typed `Promise` wrapper: creates worker, sends `ArrayBuffer`, resolves with parsed result
- Refactor `src/store/useDashboardStore.ts` `processFile()` to delegate to worker client instead of calling parser functions directly
- Update `src/store/useDashboardStore.test.ts` to mock `excelWorkerClient` instead of direct parser imports
- Worker progress reporting: `postMessage({ type: 'PROGRESS', message })` during long operations

### Out of Scope
- `FileUploadArea.tsx` progress UI — left for a follow-up phase
- Any changes to `excelParser.ts` or `academicLogic.ts` — pure functions remain untouched
- `SharedArrayBuffer` / Atomics approach — overkill, Vercel-incompatible
- Worker as fallback only for large files — always-use Worker, single code path

## Capabilities

### New Capabilities
- `web-worker-parser`: Offload Excel parsing pipeline to a Web Worker thread with progress reporting, keeping the main thread responsive during file uploads

### Modified Capabilities
None. The `excel-diagnostics` spec behavior is unchanged — `validateWorkbook` runs with identical logic, only in a different thread.

## Approach

**Always-use Worker** (single code path). Vite's `new Worker(new URL(...), { type: 'module' })` handles bundling natively. Message protocol:

```
Main → Worker: { buffer: ArrayBuffer, fileName: string, config: PeriodConfig }
Worker → Main: { type: 'DIAGNOSTIC', payload: DiagnosticReport }
            |  { type: 'PROGRESS', message: string }
            |  { type: 'RESULT', payload: { estudiantes, rowsArea, rowsAsignatura, ... } }
            |  { type: 'ERROR', message: string }
```

The `ArrayBuffer` is transferred (zero-copy) via `postMessage(buffer, [buffer])`. Results are structured-cloned back. Worker creation overhead (~1-5ms + ~100ms first-load module cache) is negligible vs parsing time (~500ms-1.5s for 15MB).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/workers/excelWorker.ts` | New | Worker entry: imports parser/logic, handles onmessage, posts results/progress/errors |
| `src/services/excelWorkerClient.ts` | New | Promise wrapper: `parseFileInWorker(file, config)` — creates worker, manages lifecycle |
| `src/store/useDashboardStore.ts` | Modified | `processFile()` delegates to `parseFileInWorker` instead of inline XLSX.read → parseWorkbook chain. Removes direct `xlsx` import |
| `src/store/useDashboardStore.test.ts` | Modified | Mock `excelWorkerClient` module; existing unit tests for `setConfig` / `updateSubjectWeight` unchanged |
| `src/services/excelParser.ts` | Unchanged | Pure functions re-imported by worker as-is |
| `src/services/academicLogic.ts` | Unchanged | Pure functions re-imported by worker as-is |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `xlsx` fails to bundle in worker chunk | Low | Vite natively supports module workers; `xlsx@0.18.5` ships ESM. Verify with `npm run build` early |
| Worker fails to load (old browser) | Very Low | Module workers supported in all modern browsers (Chrome 80+, Firefox 114+, Safari 15+). Add `try/catch` around worker construction with main-thread fallback |
| Structured clone of large result freezes briefly | Low | Result JSON is ~1-500KB; clone time <10ms even for large datasets |
| Tests need different setup | Medium | Worker code can't be imported directly in jsdom. Mitigation: pure functions already covered by existing unit tests; store tests mock `excelWorkerClient` via `vi.mock` |

## Rollback Plan

Revert `useDashboardStore.ts` `processFile()` to inline parsing (git revert). Delete `src/workers/excelWorker.ts` and `src/services/excelWorkerClient.ts`. Zero data migration — the parser functions are unchanged.

## Dependencies

None external. Vite's built-in Web Worker support (`?worker` and `{ type: 'module' }`). No new npm packages.

## Success Criteria

- [ ] Uploading a 15MB Excel file shows no UI freeze — the spinner remains responsive
- [ ] All existing parser test suites pass unchanged (`excelParser.test.ts`, `academicLogic.test.ts`)
- [ ] Store tests pass with mocked `excelWorkerClient`
- [ ] `npm run build` produces a separate worker chunk with `xlsx` bundled correctly
- [ ] Worker error cases (corrupt file, invalid structure) propagate to the store's `error` state cleanly
- [ ] Diagnostic reports from the worker render identically to current in-thread behavior

## Estimated Lines Changed

| Category | Lines |
|----------|-------|
| New: `src/workers/excelWorker.ts` | ~80 |
| New: `src/services/excelWorkerClient.ts` | ~50 |
| Modified: `src/store/useDashboardStore.ts` | ~15 changed / ~25 removed |
| Modified: `src/store/useDashboardStore.test.ts` | ~20 changed |
| **Total** | **~165 added, ~25 removed (~140 net)** |

Within 400-line review budget. Test files are excluded from the budget (they're verification, not implementation).
