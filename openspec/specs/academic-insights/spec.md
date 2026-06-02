# Academic Insights Specification

## Purpose

Detect 4 pedagogical archetypes from per-student period grade trends with false-positive guards, missing-data short-circuits, and confidence scoring. Produce Spanish-language narrative insight cards for the InsightsTab — zero store mutation, pure derivation.

## Requirements

### Requirement: Archetype Detection — El Confiado

The system MUST classify a student as El Confiado when: (a) avg(first 2 periods) ≥ 4.0, (b) grades are monotonically non-increasing, (c) total max→min drop ≥ 0.8, (d) at least one period-to-period drop ≥ 0.3.

#### Scenario: Sustained decline from high start triggers Confiado

- GIVEN a student with period grades [4.8, 4.3, 3.9, 3.5]
- WHEN `detectArchetypes()` runs
- THEN primary archetype MUST be `confiado`
- AND confidence MUST be ≥ 0.5

#### Scenario: Minor fluctuation 4.8→4.5 does NOT trigger Confiado

- GIVEN a student with grades [4.8, 4.7, 4.6, 4.5]
- WHEN `detectArchetypes()` runs
- THEN archetype MUST NOT be `confiado` (total drop 0.3 < 0.8 threshold)

#### Scenario: Non-monotonic trend rejects Confiado

- GIVEN grades [4.8, 4.0, 4.2, 3.5] (period 3 rose)
- WHEN `detectArchetypes()` runs
- THEN archetype MUST NOT be `confiado`

### Requirement: Archetype Detection — El Resiliente

The system MUST classify as El Resiliente when: (a) avg(first 2 periods) ≤ 3.0, (b) grades are monotonically non-decreasing, (c) total rise ≥ 0.8, (d) at least one period-to-period rise ≥ 0.3.

#### Scenario: Sustained improvement from low start triggers Resiliente

- GIVEN grades [2.0, 2.5, 3.0, 3.5]
- WHEN `detectArchetypes()` runs
- THEN primary archetype MUST be `resiliente`

#### Scenario: Small improvement 2.5→3.0 does NOT trigger Resiliente

- GIVEN grades [2.5, 2.6, 2.8, 3.0]
- WHEN `detectArchetypes()` runs
- THEN archetype MUST NOT be `resiliente` (total rise 0.5 < 0.8)

### Requirement: Archetype Detection — El Montaña Rusa

The system MUST classify as El Montaña Rusa when: (a) ≥ 2 sign changes in period-to-period deltas, (b) at least one peak→valley swing ≥ 0.8, (c) at least one |delta| ≥ 0.3.

#### Scenario: Alternating grades trigger Montaña Rusa

- GIVEN grades [4.5, 2.5, 4.0, 3.0]
- WHEN `detectArchetypes()` runs
- THEN primary archetype MUST be `montana-rusa`

#### Scenario: Smooth monotonic decline does NOT trigger Montaña Rusa

- GIVEN grades [4.5, 4.0, 3.5, 3.0]
- WHEN `detectArchetypes()` runs
- THEN archetype MUST NOT be `montana-rusa` (no sign changes)

### Requirement: Archetype Detection — El Radar

The system MUST classify as El Radar when no other archetype matches BUT at least one warning flag exists: final grade < 3.0 or largest single drop ≥ 0.5.

#### Scenario: Final period failing triggers Radar

- GIVEN grades [3.5, 3.2, 3.0, 2.8]
- WHEN `detectArchetypes()` runs
- THEN primary archetype MUST be `radar`

#### Scenario: Stable low average without flags does NOT trigger Radar

- GIVEN grades [2.8, 2.9, 2.7, 2.8]
- WHEN `detectArchetypes()` runs
- THEN result MUST be null (no archetype matches, no warning flags met)

### Requirement: Missing Periods Guard

The system MUST return null with reason `insufficient-data` when fewer than 2 evaluated periods exist.

#### Scenario: Single period → insufficient data

- GIVEN a student with only P1 evaluated [3.5]
- WHEN `detectArchetypes()` runs
- THEN result MUST be null
- AND reason MUST be `insufficient-data`

#### Scenario: Two periods → detection proceeds

- GIVEN a student with grades [4.5, 3.7]
- WHEN `detectArchetypes()` runs
- THEN detection MUST proceed (minimum period count met)

### Requirement: InsightsTab Rendering

The InsightsTab MUST render aggregate KPI cards per archetype and archetype-grouped student cards WITHOUT mutating the Zustand store.

#### Scenario: KPI cards show archetype counts

- GIVEN `useOracle` returns counts `{ confiado: 3, resiliente: 2, montana-rusa: 1, radar: 4 }`
- WHEN InsightsTab renders
- THEN it MUST display 4 KPI cards, each with archetype label, student count, and severity color

#### Scenario: Student cards show grades, severity, and narrative

- GIVEN a confiado student with grades [4.8, 4.3, 3.9, 3.5] and severity `high`
- WHEN InsightsTab renders
- THEN the student card MUST show name, period grades, archetype label, severity badge, and pedagogical narrative

#### Scenario: Group filter filters to selected archetype

- GIVEN the dropdown is set to "El Confiado"
- WHEN InsightsTab renders
- THEN it MUST display ONLY students classified as `confiado`

#### Scenario: Empty state when no results

- GIVEN `useOracle` returns empty `[]`
- WHEN InsightsTab renders
- THEN it MUST display "No hay datos suficientes"

#### Scenario: Store is NOT mutated by rendering

- GIVEN InsightsTab mounts
- WHEN rendering completes
- THEN `useDashboardStore.getState()` MUST be identical before and after mount
