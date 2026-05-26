# Tasks: Web Worker Excel Parser

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~300 - 350 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Types, worker, client, store integration, UI, and tests | PR 1 | Base branch: main. Self-contained, no migration. |

## Phase 1: Types & Protocol

- [x] 1.1 Create `src/services/workerTypes.ts` — export `WorkerRequest`, `WorkerProgress`, `WorkerDiagnostic`, `WorkerResult`, `WorkerError`, `ParsedExcelData`, and `WorkerMessage` discriminated union per spec protocol table
- [x] 1.2 Verify types compile: `npx tsc --noEmit --pretty src/services/workerTypes.ts`

## Phase 2: Worker Implementation

- [x] 2.1 Create `src/services/excelWorker.ts` — `onmessage` handler switches on `PARSE`, runs full pipeline (XLSX.read → validateWorkbook/post DIAGNOSTIC → parseWorkbook/post PROGRESS → inferSubjectWeights/post PROGRESS → applyAcademicLogic/post PROGRESS → flattenRows/post RESULT), wraps body in try/catch posting `ERROR` on throw
- [x] 2.2 Verify worker exports no globals (pure module), no self.onerror leakage, and `self.onmessage` is registered

## Phase 3: Worker Client

- [x] 3.1 Create `src/services/excelWorkerClient.ts` — exports `parseFileInWorker(file, config, callbacks)` and `terminateWorker()`. Manages singleton worker, terminates on re-upload. Transfers `ArrayBuffer` via transfer list. Maps `PROGRESS`/`DIAGNOSTIC`/`RESULT`/`ERROR` postMessages to typed callback invocations. Falls back to main-thread parsing on Worker construction failure.
- [x] 3.2 Verify client handles: concurrent upload termination, `new Worker` failure fallback, and postMessage transfer list detaches buffer

## Phase 4: Store Integration

- [x] 4.1 Add `parsingProgress: string | null` field to `DashboardState` in `src/store/useDashboardStore.ts` (null when idle)
- [x] 4.2 Replace `processFile` body in store: remove `import * as XLSX` and inline pipeline; delegate to `excelWorkerClient.parseFileInWorker` with store callbacks that `set()` progress/diagnostic/result/error. Keep `applyAcademicLogic`/`flattenRows` imports for `setConfig` and `updateSubjectWeight`.
- [x] 4.3 Wire cancellation: calling `processFile` while loading terminates previous worker before creating new one

## Phase 5: Loading UI

- [x] 5.1 Update `FileUploadArea.tsx` — subscribe to `parsingProgress`, replace static `<span>Procesando...</span>` with dynamic message from store (e.g., `parsingProgress || 'Procesando...'`)
- [x] 5.2 Update `FileUploadArea.test.tsx` — add test for progress text rendering when store has `parsingProgress` value

## Phase 6: Tests & Verification

- [x] 6.1 Add tests in `src/store/useDashboardStore.test.ts`: mock `excelWorkerClient`, verify store handles `PROGRESS`→ sets `parsingProgress`, `DIAGNOSTIC`→ sets `diagnosticReport`, `RESULT`→ sets all state fields, `ERROR`→ sets error + loading false, re-upload terminates previous worker
- [x] 6.2 Run `npm run test` — confirm all 145 existing tests pass plus new ones
- [x] 6.3 Run `npm run build` — confirm Vite dev/build produce valid worker chunk with `new Worker(new URL(...), { type: 'module' })`

## Dependencies

```
1.1 (types) → 2.1 (worker) → 3.1 (client) → 4.2 (store)
4.1 (store state) → 5.1 (UI)
3.1 (client) → 6.1 (tests)
```
