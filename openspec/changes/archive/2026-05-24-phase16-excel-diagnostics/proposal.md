# Proposal: Módulo de Diagnóstico y Tolerancia a Fallos en Carga de Excel

## Intent

Provide a robust Excel validation layer that flags structure, content, and formatting issues to teachers with row/column context prior to parsing. This prevents uncaught app crashes or silent failures, improving user experience and data reliability.

## Scope

### In Scope
- Pure decoupled validation function `validateWorkbook(workbook)` in `excelParser.ts` returning a `DiagnosticReport` with `CRITICAL`, `WARNING`, and `SUGGESTION` levels and error codes.
- Comprehensive unit tests with 100% logic coverage under Strict TDD.
- Zustand store state (`diagnosticReport`) integration to call validation in `processFile` and block upload on `CRITICAL` issues.
- Expandable premium accordion list in the UI displaying all categorized issues with cell-level coordinates and readable actions.

### Out of Scope
- Auto-fixing malformed or broken Excel files.
- Multi-file consolidation comparison.

## Capabilities

### New Capabilities
- `excel-diagnostics`: Validation layer identifying sheet schema issues, missing names, invalid grades, and empty periods before data parsing.

### Modified Capabilities
- None

## Approach

**Approach 1: Decoupled Multi-Phase Engine (Two-pass execution)**
1. **Validation Phase**: Run `validateWorkbook` against the loaded sheet, collecting all issues without early termination.
2. **Evaluation Phase**: Block process and display report if any `CRITICAL` issues are found. Otherwise, allow parsing and show `WARNING` or `SUGGESTION` items in the accordion.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/services/excelParser.ts` | Modified | Add `validateWorkbook`, `getColumnLetter`, interfaces, and codes. |
| `src/services/excelParser.test.ts` | Modified | Add exhaustive unit tests for `validateWorkbook`. |
| `src/store/useDashboardStore.ts` | Modified | Store `diagnosticReport`, run validator in `processFile`, block if invalid. |
| `src/components/dashboard/FileUploadArea.tsx` | Modified | Render the expandable diagnostic issues accordion. |
| `src/components/dashboard/FileUploadArea.test.tsx` | Modified | Verify accordion renders correctly based on store state. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Large files crash the validation process | Low | Ensure `validateWorkbook` only reads sheet structure and handles cell properties safely. |
| Verbose empty period warnings overwhelm users | Medium | Categorize missing grades on empty periods as `WARNING` or `SUGGESTION` to keep them non-blocking. |

## Rollback Plan

Revert git changes to original files and fallback to the legacy direct parsing logic in `excelParser.ts` and store.

## Dependencies

- None

## Success Criteria

- [ ] 0 uncaught crashes when loading malformed Excel sheets.
- [ ] 100% unit test coverage for `validateWorkbook` diagnostic logic under Strict TDD.
- [ ] UI lists warnings, suggestions, and critical errors with row and column letter coordinates.
