import 'vitest';

declare module 'vitest' {
  interface Assertion<_T = unknown> {
    toHaveNoViolations(): Promise<void>;
  }
}
