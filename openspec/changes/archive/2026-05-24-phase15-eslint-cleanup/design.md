# Design: ESLint Cleanup

## Technical Approach

Configure specialized linter overrides for test files and pattern-based exclusions for unused variables in `eslint.config.js`. This is paired with precise, surgical refactoring of code structures inside the production files to eliminate useless variable assignments and re-typings. This ensures robust CI/CD compliance while maintaining strict standards for production and flexibility for testing.

## Architecture Decisions

### Decision: ESLint Flat Config Adjustments

**Choice**: Add overrides in `eslint.config.js` to allow `@typescript-eslint/no-explicit-any` in test files (`**/*.test.{ts,tsx}`) and update `@typescript-eslint/no-unused-vars` to ignore variables/arguments starting with an underscore (`_`).
**Alternatives considered**:
- Resolving all `any` types in test files (rejected: too verbose, high-effort, offers no architectural value).
- Disabling these rules project-wide (rejected: degrades production code quality).
**Rationale**: Keeps production code safe and strictly typed while giving test mocks the required flexibility.

### Decision: Remove Useless Assignments by Declaring Without Initial Value

**Choice**: Declare local variables (`valA`, `valB`, `adviceText`) without assigning default values where they are immediately reassigned in conditional branches.
**Alternatives considered**:
- Keeping initializations and reading them (rejected: introduces dummy behavior).
- Declaring them inside blocks (rejected: variables must be scoped outside block for subsequent sorting/returns).
**Rationale**: Directly satisfies ESLint's `no-useless-assignment` rule while keeping the code clean and logical.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `eslint.config.js` | Modify | Configure rule overrides for test files and underscore variable exclusions. |
| `src/hooks/useAnalysisPipeline.ts` | Modify | Declare `valA` and `valB` without initializing them to `null`. |
| `src/services/academicLogic.ts` | Modify | Typecast `subjectWeights` as structured unknown/nested records instead of `any`. |
| `src/services/excelParser.ts` | Modify | Change `let rawVal` to `const rawVal`. |
| `src/services/reportEngine.ts` | Modify | Declare `adviceText` without initializing it to `''`. |
| `src/store/useDashboardStore.ts` | Modify | Change `let newEstudiantes` to `const newEstudiantes`. |

## Interfaces / Contracts

No new public interfaces or contracts are created. Below are the precise internal typecasts and configurations:

### `eslint.config.js`
```javascript
  {
    files: ['**/*.{ts,tsx}'],
    // ...
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
```

### `src/services/academicLogic.ts`
```typescript
      // Cast subjectWeights to a specific nested index signature instead of 'any'
      type WeightsRecord = Record<string, Record<string, Record<string, number>>>;
      type FlatWeightsRecord = Record<string, Record<string, number>>;

      const groupWeights = (subjectWeights as unknown as WeightsRecord)[student.grupo] || {};
      const weights = groupWeights[areaName] || (subjectWeights as unknown as FlatWeightsRecord)[areaName];
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Static Analysis | Lint rules execution | Run `npm run lint` and verify exactly 0 errors and 0 warnings are emitted. |
| Unit / Integration | Calculations, Excel Parsing, Report Generation, Store State | Run `npm run test` and verify that all 133 tests pass successfully. |

## Migration / Rollout

No migration required. This is a local refactoring of build-time rules and code hygiene.

## Open Questions

None.
