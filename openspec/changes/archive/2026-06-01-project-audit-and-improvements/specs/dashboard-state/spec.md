# Delta for Dashboard State

## ADDED Requirements

### Requirement: Derived State for Group Selection

Dashboard tabs MUST NOT mutate global store state inside `useEffect` side effects. Group selection MUST be derived from user action handlers or controlled props.

#### Scenario: VolatilityTab mounts without global mutation

- GIVEN `VolatilityTab` mounts with a selected group
- WHEN the component renders
- THEN `setGlobalGroup` MUST NOT be called inside `useEffect`
- AND the selected group SHALL be determined from props, URL params, or event handlers

#### Scenario: TutorsTab mounts without global mutation

- GIVEN `TutorsTab` mounts with a selected group
- WHEN the component renders
- THEN `setGlobalGroup` MUST NOT be called inside `useEffect`

#### Scenario: Edge — No group selected on mount

- GIVEN `VolatilityTab` or `TutorsTab` mounts with no group pre-selected
- WHEN the component renders
- THEN it SHOULD render an empty/inactive state
- AND SHALL NOT auto-select an arbitrary group via effect

### Requirement: Estudiantes Excluded from IndexedDB

The Zustand dashboard store MUST NOT persist `estudiantes` in IndexedDB. Only derived analysis results SHALL be persisted.

#### Scenario: Reload without raw student data

- GIVEN the app has loaded `estudiantes` data in memory
- WHEN the page is reloaded
- THEN `estudiantes` SHALL NOT be in the rehydrated persisted state
- AND the app SHALL recover derived data from the calculation pipeline

#### Scenario: Edge — Large dataset performance

- GIVEN 1000+ student records in the store
- WHEN the store persists to IndexedDB
- THEN the serialization SHALL NOT include `estudiantes`
- AND IndexedDB write SHALL complete within 200ms
