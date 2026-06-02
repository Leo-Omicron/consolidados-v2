# Academic Constants Specification

## Purpose

Define shared academic constants and period-evaluation detection logic consumed by all services and UI components, eliminating hardcoded values and duplicated logic.

## Requirements

### Requirement: PASSING_GRADE Constant

The system MUST expose a single `PASSING_GRADE` constant in a shared module, replacing all hardcoded `3.0` references for passing-grade checks.

#### Scenario: All services reference the same constant

- GIVEN any module that evaluates whether a student's average passes
- WHEN the comparison uses `PASSING_GRADE`
- THEN the constant SHALL originate from the shared module (`academicLogic` or dedicated constants file)
- AND no hardcoded `3.0` SHALL appear in business logic

#### Scenario: Value change propagates automatically

- GIVEN the `PASSING_GRADE` constant definition
- WHEN its value is updated
- THEN all evaluations across the codebase SHALL use the new value without additional edits

#### Scenario: Edge — Import mistake detection

- GIVEN a lint or build step
- WHEN hardcoded `3.0` appears in a location that should reference `PASSING_GRADE`
- THEN the build/lint step SHOULD flag it or the grep audit SHALL catch it

### Requirement: Shared Period-Evaluation Module

The system MUST provide a single shared module for academic period-evaluation detection, consumed by all three existing call sites (`academicLogic`, `reportEngine`, `useReportsLogic`).

#### Scenario: All call sites use the shared module

- GIVEN period data requiring evaluation
- WHEN any of the three call sites invokes period detection
- THEN it MUST call the shared module
- AND no duplicate detection logic SHALL remain outside the module

#### Scenario: Edge — Empty or malformed period data

- GIVEN period data that is null, empty, or malformed
- WHEN the shared module processes it
- THEN it MUST return a safe default (no evaluation detected) without throwing
