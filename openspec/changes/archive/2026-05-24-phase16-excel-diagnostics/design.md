# Design: Excel Diagnostics and Tolerance

## Technical Approach

Introduce a decoupled pre-parsing validation phase in `excelParser.ts` via a pure function `validateWorkbook(workbook: XLSX.WorkBook): DiagnosticReport`. This runs before actual student data parsing, collecting all structural anomalies (`CRITICAL`), data problems (`WARNING`), and empty sheets (`SUGGESTION`) with cell-level coordinates (Sheet, Row, Column Letter). The validation results are stored in Zustand (`useDashboardStore.ts`), blocking parsing on `CRITICAL` errors while allowing `WARNING` and `SUGGESTION` alerts to be displayed in a premium accordion within `FileUploadArea.tsx`.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Decoupled validation vs Inline parsing validation | Inline parsing is faster but couples validation with data extraction, making UI reports and clean error handling harder. Decoupled validation runs in two passes, but is extremely clean, safe, and testable. | **Decoupled validation (`validateWorkbook`)**: Provides a clean, pure function that yields a comprehensive report without mutating core business structures. |
| Strict blocking on any issue vs Category-based blocking | Blocking on warnings (like empty grades or missing student names) frustrates users during rollout. | **Category-based blocking**: Only `CRITICAL` issues (missing schema, missing name columns) block parsing. `WARNING` and `SUGGESTION` show on screen but let ingestion complete. |

## Data Flow

```
[User Excel File] ──→ FileUploadArea ──→ processFile() (Store)
                                              │
                      ┌───────────────────────┴──────────────────────┐
                      ▼                                              ▼
             validateWorkbook()                               [If CRITICAL]
                      │                                              │
         Yields `DiagnosticReport`                                   ▼
                      │                                        Block parsing &
         Updates store `diagnosticReport`                     Show Error UI
                      │
                      ▼
         [If Valid / Only Warnings] ──→ parseWorkbook() ──→ Update Dashboard
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/services/excelParser.ts` | Modify | Implement `validateWorkbook`, `getColumnLetter`, interfaces, and codes. |
| `src/store/useDashboardStore.ts` | Modify | Store `diagnosticReport` state, call `validateWorkbook` in `processFile`, block ingestion on critical failures. |
| `src/components/dashboard/FileUploadArea.tsx` | Modify | Render premium expandable diagnostic accordion and disable upload/parsing on critical errors. |

## Interfaces / Contracts

### Diagnostic Types
```typescript
export type DiagnosticSeverity = 'CRITICAL' | 'WARNING' | 'SUGGESTION';

export interface DiagnosticIssue {
  code: 'MISSING_SCHEMA' | 'MISSING_NAME' | 'INVALID_GRADE' | 'EMPTY_GRADE' | 'EMPTY_SHEET';
  severity: DiagnosticSeverity;
  sheet: string;
  row?: number; // 1-indexed
  col?: string; // Excel Column Letter (e.g., 'C')
  message: string;
  action: string;
}

export interface DiagnosticReport {
  isValid: boolean;
  totalSheetsProcessed: number;
  issues: DiagnosticIssue[];
}
```

### Column Letter Converter
```typescript
export function getColumnLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}
```

### Pre-Parsing Rule Validation Engine (`validateWorkbook`)

1. **Sheet Scan**:
   - Loops over `workbook.SheetNames` ignoring sheets where normalized name matches `'RESUMEN'`.
   - Tracks `totalSheetsProcessed`.
   - If sheet is empty or `!ref` is missing, registers `SUGGESTION` (`EMPTY_SHEET`).
2. **Row Count Scan**:
   - Converts sheet to array: `XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null })`.
   - If `rows.length < 4`, registers `CRITICAL` (`MISSING_SCHEMA`).
3. **Header Schema Scan**:
   - Normalized columns 0 and 1 of rows 0-2 MUST contain `'ID'` or `'#'` (col 0) and `'NAME'` or `'ESTUDIANTE'` (col 1). Failing this registers `CRITICAL` (`MISSING_SCHEMA`).
4. **Data Scan (Row 4 onwards)**:
   - Evaluates columns. If student name is blank but row contains other values: registers `WARNING` (`MISSING_NAME`).
   - Maps columns representing periods (using `parseHeaders`). For each mapped period column:
     - If cell is empty (null/undefined/blank): registers `WARNING` (`EMPTY_GRADE`).
     - If cell is out-of-range (not numeric, or numeric outside `[1.0, 5.0]`): registers `WARNING` (`INVALID_GRADE`).

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (`excelParser.test.ts`) | `getColumnLetter` | Boundary test values from 0 (A) to 702 (AAA). |
| Unit (`excelParser.test.ts`) | `validateWorkbook` | Mock workbooks with empty sheets, missing headers, invalid grades, and empty grades under TDD. |
| Integration (`useDashboardStore.test.ts`) | Ingestion flow | Verify store blocks and saves report correctly on critical errors. |
| Component (`FileUploadArea.test.tsx`) | UI Presentation | Verify accordion renders categorized warnings/suggestions and disables upload on critical findings. |

## Migration / Rollout

No database migration required. Clean client-side validation logic.

## Open Questions

None.
