# Web Worker Parser Specification

## Purpose

Offload Excel parsing pipeline to a Web Worker, keeping the main thread responsive.

## Message Protocol

`ArrayBuffer` transferred (zero-copy) via transfer list.

| Direction | Type | Shape |
|-----------|------|-------|
| Main→Worker | `PARSE` | `{ type, fileData: ArrayBuffer, fileName: string, config: PeriodConfig }` |
| Worker→Main | `PROGRESS` | `{ type, phase: string, message: string }` |
| Worker→Main | `DIAGNOSTIC` | `{ type, report: DiagnosticReport }` |
| Worker→Main | `RESULT` | `{ type, data: { estudiantes, rowsArea, rowsAsignatura, subjectWeights, availableGroups, diagnosticReport } }` |
| Worker→Main | `ERROR` | `{ type, message: string, stack?: string }` |

## Requirements

### Parse valid Excel and return structured data

Every `processFile()` MUST create a worker and delegate the full pipeline. Worker MUST import pure functions from `excelParser.ts`/`academicLogic.ts` unmodified. On success, worker MUST post `RESULT` with all state fields.

- GIVEN a valid Excel with 3 sheets (10A, 10B, RESUMEN)
- WHEN `processFile(file)` is called
- THEN loading is `true` during parse, `RESULT` has non-empty `estudiantes`/`rowsArea`/`rowsAsignatura`, loading becomes `false`

- GIVEN an Excel with a CRITICAL schema issue (missing ID column)
- WHEN the worker validates it
- THEN worker posts `DIAGNOSTIC` with `isValid === false`, store sets `diagnosticReport`/`error`, loading becomes `false`

### Report progress during parsing

Worker MUST post `PROGRESS` before each pipeline phase. Store SHOULD expose a `progressMessage` field.

- GIVEN a valid file being parsed
- WHEN the pipeline runs
- THEN `PROGRESS` messages arrive in order: `'Leyendo archivo...'`, `'Extrayendo estudiantes...'`, `'Calculando pesos...'`, `'Aplicando lógica académica...'`

### Worker handles invalid/corrupt files with typed errors

Worker MUST wrap `onmessage` in try/catch. On catch, post `ERROR` with `message` and `stack`. MUST NOT let exceptions reach `self.onerror`.

- GIVEN a corrupt binary causing `XLSX.read()` to throw
- WHEN the worker processes it
- THEN worker posts `{ type: 'ERROR', message, stack }`, store sets `{ loading: false, error: message }`

### Main thread terminates long-running parses

Worker client MUST hold a reference to the active worker. Calling `processFile()` while a previous parse runs MUST `terminate()` the previous worker first.

- GIVEN a parse in progress
- WHEN the user uploads a second file
- THEN previous worker is terminated, a new one is created, and the second parse completes

### Store uses worker client transparently

`processFile()` MUST delegate to `excelWorkerClient.parseFileInWorker(file, config)`. `processFile()` MUST NOT import `xlsx` or call parser functions directly; `setConfig()` and `updateSubjectWeight()` MAY import `flattenRows` and `applyAcademicLogic` for recalculation of already-parsed data.

- GIVEN the store's `processFile` exists
- WHEN any file is uploaded
- THEN it calls `parseFileInWorker` and never imports `xlsx` directly

### All existing tests pass unchanged

All 145 existing tests MUST pass. Worker tests MAY be added.

- GIVEN the existing test suite
- WHEN `npm run test` runs
- THEN all tests pass without modifying `excelParser.test.ts` or `academicLogic.test.ts`

### ArrayBuffer transferred, not copied

`fileData` MUST be in `postMessage`'s transfer list. After transfer, `byteLength` MUST be 0 (detached).

- GIVEN a file with `file.size > 0`
- WHEN the client calls `postMessage(msg, [fileData])`
- THEN `fileData.byteLength` is 0 on the main thread

### Worker works in Vite dev and Vercel production

Worker MUST use Vite's module worker syntax. Both `npm run dev` and `npm run build` MUST produce a working worker chunk.

- GIVEN `npm run dev` is running
- WHEN a file is uploaded
- THEN the worker loads without CORS or module errors

### Empty workbook errors

Worker MUST post `DIAGNOSTIC` with `isValid: false` + CRITICAL when workbook has zero non-RESUMEN sheets.

- GIVEN an Excel with only a RESUMEN sheet
- WHEN validated
- THEN worker posts `DIAGNOSTIC` with `isValid === false` and a CRITICAL issue

### Worker fails to load

If `new Worker(...)` throws, the client MUST catch and reject with a clear error. SHOULD fall back to main-thread parsing.

- GIVEN a browser without module worker support
- WHEN `new Worker(url, { type: 'module' })` throws
- THEN the client catches and `processFile()` rejects
