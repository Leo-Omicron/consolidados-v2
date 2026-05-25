# Excel Diagnostics Specification

## Purpose

Provide a pre-parsing diagnostic validation layer that scans Excel workbooks for structural and data anomalies. This module classifies findings into three severity levels (CRITICAL, WARNING, SUGGESTION) to block processing on severe structural failures while allowing tolerance for minor data issues by providing contextual coordinates (sheet, row, column letter).

## Requirements

### Requirement: Workbook Structure Validation (CRITICAL)

The system SHALL perform a structural scan of the workbook before data ingestion. It MUST block any further processing and classify the result as CRITICAL if the workbook contains no visible sheets, is entirely empty, or is missing the mandatory primary columns ("ID", "Name") on any populated grading sheet.

#### Scenario: Block on Empty Workbook or Missing Schema

- GIVEN a workbook with an empty active sheet or a sheet missing the "ID" or "Name" headers
- WHEN the workbook is evaluated by `validateWorkbook`
- THEN the system MUST return a diagnostic report containing a CRITICAL finding with error code `MISSING_SCHEMA`
- AND the report MUST specify the coordinate where the failure occurred (e.g. Sheet: "Sheet1", Row: 1)

### Requirement: Grade Range and Value Integrity (WARNING)

The system SHALL check cell values in grading periods to ensure they represent valid academic scores. Any grade value outside the permitted range [1.0, 5.0], or any empty grade cell, MUST be classified as a WARNING. The system MUST NOT block parsing for WARNING findings but SHALL convert empty grade values to `null`.

#### Scenario: Out of Bounds or Empty Grade Warnings

- GIVEN a student row containing an out-of-bounds grade of 5.5 in column C (row 4) and an empty grade cell in column D (row 4)
- WHEN the workbook is evaluated by `validateWorkbook`
- THEN the system SHALL report a WARNING with code `INVALID_GRADE` for column C, row 4
- AND a WARNING with code `EMPTY_GRADE` for column D, row 4
- AND the underlying parser SHALL convert the empty grade to `null` on ingestion

### Requirement: Empty Sheet Tolerance (SUGGESTION)

The system SHOULD gracefully ignore worksheets within the workbook that contain no data or are entirely empty, providing a SUGGESTION finding without triggering a WARNING or CRITICAL error.

#### Scenario: Ignore Completely Empty Non-Primary Worksheet

- GIVEN a workbook with a primary populated sheet and a secondary empty sheet named "Hoja2"
- WHEN the workbook is evaluated by `validateWorkbook`
- THEN the system SHALL report a SUGGESTION with code `EMPTY_SHEET` for "Hoja2"
- AND the parsing process MUST ignore "Hoja2" and continue with the primary sheet

### Requirement: Dynamic UI Diagnostic Report Presentation (UI)

The system MUST dynamically display the diagnostic report in the user interface inside an expandable, high-priority accordion list under the file upload area, clearly grouping issues by severity (CRITICAL, WARNING, SUGGESTION) and displaying cell-level coordinates and actionable resolution instructions.

#### Scenario: Displaying Diagnostic Accordion in File Upload Area

- GIVEN a diagnostic report containing 1 CRITICAL error, 2 WARNINGs, and 1 SUGGESTION
- WHEN the user uploads the file and the validation finishes
- THEN the system MUST display the diagnostic report accordion with the issues categorized by level
- AND the upload button MUST be disabled due to the CRITICAL error
- AND each item in the accordion MUST show the sheet name, row number, column letter, and a human-readable action instruction
