# Delta for Dashboard State

## ADDED Requirements

### Requirement: Tab Transitions Wrapped in `startTransition`

The ReportsTab tab-switch handler MUST wrap `setActiveTab(item.id)` in `startTransition` to defer Suspense fallback display on fast tab switches.

#### Scenario: Fast tab switch avoids Suspense fallback

- GIVEN the user is viewing a ReportsTab with multiple tabs
- WHEN the user clicks a different tab
- THEN the active tab SHALL update inside `startTransition`
- AND the Suspense fallback SHALL NOT appear for chunk loads under 200ms

#### Scenario: Slow tab switch shows fallback

- GIVEN a tab switch triggers a chunk load exceeding 200ms
- WHEN the user clicks a different tab
- THEN the Suspense fallback SHALL appear as expected
- AND `startTransition` SHALL NOT suppress fallback for slow loads

### Requirement: Single Pipeline Invocation in AnalysisTab

The AnalysisTab MUST compute KPI comparison data and grouped display data from a single `useAnalysisPipeline` invocation.

#### Scenario: Single pipeline call produces correct output

- GIVEN AnalysisTab renders with active students and filter/sort settings
- WHEN the component mounts
- THEN `useAnalysisPipeline` SHALL be called exactly once
- AND grouped display data SHALL be the pipeline output
- AND original KPI data SHALL be computed directly from unfiltered `rowsArea`

#### Scenario: Edge — KPI values match previous behavior

- GIVEN AnalysisTab computes with a single pipeline call
- WHEN the pipeline output changes
- THEN KPI comparison values SHALL match the values produced by the previous dual-call approach

### Requirement: Memoized Report Data Reused in Export

`handleExportConsolidadoCompleto` MUST reference already-computed memoized data instead of calling individual `generate*Report()` generator functions.

#### Scenario: Export uses memoized data

- GIVEN the user clicks "Export Consolidado Completo"
- WHEN `handleExportConsolidadoCompleto` executes
- THEN it SHALL reference `groupPerformanceData`, `outstandingStudentsData`, and other memoized values already in scope
- AND zero redundant `generate*Report()` calls SHALL be made

#### Scenario: Edge — Empty memoized data

- GIVEN memoized report data is empty or null
- WHEN `handleExportConsolidadoCompleto` executes
- THEN the export SHALL produce an empty or placeholder document
- AND no `generate*Report()` calls SHALL be made

### Requirement: Group Existence Validated Before Export

The `canExportConsolidadoCompleto` guard MUST verify at least one student belongs to the selected group before enabling the export button.

#### Scenario: Export disabled for group with no students

- GIVEN `activeGroupToUse` is set to a group name
- AND no student in `estudiantes` has `grupo === activeGroupToUse`
- WHEN the component evaluates `canExportConsolidadoCompleto`
- THEN the export button SHALL be disabled
- AND `canExportConsolidadoCompleto` SHALL return `false`

#### Scenario: Export enabled for group with students

- GIVEN `activeGroupToUse` is set to a valid group name
- AND at least one student in `estudiantes` has `grupo === activeGroupToUse`
- WHEN the component evaluates `canExportConsolidadoCompleto`
- THEN the export button SHALL be enabled
- AND `canExportConsolidadoCompleto` SHALL return `true`

#### Scenario: Edge — null group

- GIVEN `activeGroupToUse` is null or undefined
- WHEN the component evaluates `canExportConsolidadoCompleto`
- THEN the export button SHALL remain disabled
- AND the check SHALL short-circuit without scanning `estudiantes`
