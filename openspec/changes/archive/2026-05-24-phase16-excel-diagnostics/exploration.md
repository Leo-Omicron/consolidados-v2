## Exploration: phase16-excel-diagnostics

### Current State
Currently, `src/services/excelParser.ts` has very basic error handling:
- In `parseWorkbook`, sheets with less than 4 rows are silently skipped.
- In `extractStudents`, grades outside the 0.0 to 5.0 range are silently set to `null`, and rows with missing student names are silently ignored.
- In `useDashboardStore.ts`, if a file contains critical structure errors, the app can either crash with an uncaught error or silently fail to load any students without giving the user clear action items or cell-level coordinates of what went wrong.

### Affected Areas
- `src/services/excelParser.ts` — Will house the diagnostic interfaces, the helper function `getColumnLetter`, and the decoupled validator `validateWorkbook`.
- `src/services/excelParser.test.ts` — Will include comprehensive unit tests for `validateWorkbook`, verifying critical errors, warnings, suggestions, out-of-range grades, missing student names, empty grades, etc.
- `src/store/useDashboardStore.ts` — Will store the `diagnosticReport` state, call `validateWorkbook` inside `processFile`, and block further parsing if `report.isValid` is `false`.
- `src/components/dashboard/FileUploadArea.tsx` — Will render a beautiful, expandable premium accordion list of the diagnostic issues (warnings, suggestions, critical errors) with cell-level coordinates and helpful error codes.
- `src/components/dashboard/FileUploadArea.test.tsx` — Will verify that the UI renders the diagnostic report when mock store state contains it.

### Approaches
1. **Decoupled Multi-Phase Engine (Two-pass execution) [RECOMMENDED]**
   - **Description**: Completely separate validation (`validateWorkbook`) from the parsing process (`parseWorkbook`). Run the diagnostic check first, collect ALL issues (critical, warning, suggestion) into a single report, and only proceed to parsing if no critical issues exist.
   - **Pros**: Clean separation of concerns (SRP); produces a complete list of all issues across all sheets instead of aborting at the first error; highly testable.
   - **Cons**: Negligible dual-pass overhead (milliseconds for typical consolidation sheets).
   - **Effort**: Low-Medium

2. **Single-pass Integrated Parser & Validator**
   - **Description**: Inject validation checks directly into the existing `parseWorkbook` and `extractStudents` routines, accumulating warnings or throwing a custom exception on critical errors.
   - **Pros**: Single iteration over rows.
   - **Cons**: High coupling; aborts early on the first critical error, preventing the user from seeing other issues; more complex test setup.
   - **Effort**: Medium

### Recommendation
We recommend **Approach 1 (Decoupled Multi-Phase Engine)** because it maximizes user experience (UX) and developer experience (DX). By separating the validator, we can write robust, targeted unit tests in `excelParser.test.ts` and present the user with a comprehensive list of all sheet issues (including specific column letters like "C" or "E") at once.

### Risks
- **Over-verbosity**: Emitting a warning for every empty grade cell might overwhelm the user if a spreadsheet is in progress (e.g. term 3 hasn't happened yet). We must categorize these as `WARNING` or `SUGGESTION` and ensure the UI collapses them nicely.
- **Performance**: Double iteration over Excel rows. We have verified this is completely negligible for spreadsheet sizes processed by this tool (<1,000 rows).

### Ready for Proposal
Yes — The architecture is solid and clear. We are ready to propose the spec and start implementing once the proposal is approved.
