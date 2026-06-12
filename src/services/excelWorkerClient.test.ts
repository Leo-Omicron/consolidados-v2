import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseFileInWorker, terminateWorker } from './excelWorkerClient';
import type { ParsedExcelData, WorkerMessage } from './workerTypes';

// We need to mock the Worker constructor and its methods.
// vitest/jsdom has no Worker, so we stub it.
describe('excelWorkerClient', () => {
  let mockWorkerPostMessage: ReturnType<typeof vi.fn>;
  let mockWorkerAddEventListener: ReturnType<typeof vi.fn>;
  let mockWorkerTerminate: ReturnType<typeof vi.fn>;
  let messageHandlers: Array<(e: MessageEvent) => void> = [];
  let errorHandlers: Array<(e: ErrorEvent) => void> = [];

  const mockParsedData: ParsedExcelData = {
    estudiantes: [{ id: '1', name: 'Alice', CURSO: 'test', grupo: '10A', areas: {} }],
    rowsArea: [],
    rowsAsignatura: [],
    subjectWeights: {},
    availableGroups: ['Todos', '10A'],
    diagnosticReport: { isValid: true, totalSheetsProcessed: 1, issues: [] }
  };

  // Microtask flush helper
  const flushMicrotasks = (): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, 0));

  beforeEach(() => {
    messageHandlers = [];
    errorHandlers = [];
    mockWorkerPostMessage = vi.fn();
    mockWorkerTerminate = vi.fn();
    mockWorkerAddEventListener = vi.fn((type: string, handler: (e: unknown) => void) => {
      if (type === 'message') messageHandlers.push(handler as (e: MessageEvent) => void);
      if (type === 'error') errorHandlers.push(handler as (e: ErrorEvent) => void);
    });

    // Use a regular function so 'new Worker(...)' works
    const MockWorker = vi.fn(function (this: unknown, _url: string, _options?: unknown) {
      (this as Record<string, unknown>).postMessage = mockWorkerPostMessage;
      (this as Record<string, unknown>).addEventListener = mockWorkerAddEventListener;
      (this as Record<string, unknown>).terminate = mockWorkerTerminate;
      (this as Record<string, unknown>).removeEventListener = vi.fn();
    }) as unknown as typeof Worker;
    vi.stubGlobal('Worker', MockWorker);
  });

  afterEach(() => {
    terminateWorker();
    vi.unstubAllGlobals();
  });

  function simulateWorkerMessage(msg: WorkerMessage): void {
    messageHandlers.forEach(h => h(new MessageEvent('message', { data: msg })));
  }

  it('parses a file and resolves with ParsedExcelData', async () => {
    const promise = parseFileInWorker([], {P1: 33.3, P2: 33.3, P3: 33.4}, {});

    // Flush microtasks so arrayBuffer().then() runs
    await flushMicrotasks();

    // Worker should have received postMessage with file data
    expect(mockWorkerPostMessage).toHaveBeenCalledTimes(1);
    const posted = mockWorkerPostMessage.mock.calls[0];
    expect(posted[0].type).toBe('PARSE');
    // New API sends files array, not a single fileName
    expect(posted[0].files).toBeDefined();

    // Simulate worker response
    simulateWorkerMessage({ type: 'RESULT', data: mockParsedData });

    const result = await promise;
    expect(result.estudiantes).toHaveLength(1);
    expect(result.availableGroups).toContain('10A');
    expect(result.diagnosticReport.isValid).toBe(true);
  });

  it('rejects when worker sends ERROR', async () => {
    

    const promise = parseFileInWorker([], {P1: 33.3, P2: 33.3, P3: 33.4}, {});
    await flushMicrotasks();

    simulateWorkerMessage({ type: 'ERROR', message: 'parse failed', stack: 'at Worker' });

    await expect(promise).rejects.toThrow('parse failed');
  });

  it('calls onProgress callback with phase and message', async () => {
    const onProgress = vi.fn();

    const promise = parseFileInWorker([], {P1: 33.3, P2: 33.3, P3: 33.4}, {}, { onProgress });
    await flushMicrotasks();

    // Simulate progress and result
    simulateWorkerMessage({ type: 'PROGRESS', phase: 'Leyendo archivos...', message: '10%' });
    simulateWorkerMessage({ type: 'PROGRESS', phase: 'Calculando pesos...', message: '50%' });
    simulateWorkerMessage({ type: 'RESULT', data: mockParsedData });

    await promise;

    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenCalledWith('Leyendo archivos...', '10%');
    expect(onProgress).toHaveBeenCalledWith('Calculando pesos...', '50%');
  });

  it('calls onDiagnostic callback with report', async () => {
    const onDiagnostic = vi.fn();

    const promise = parseFileInWorker([], {P1: 33.3, P2: 33.3, P3: 33.4}, {}, { onDiagnostic });
    await flushMicrotasks();

    const report = { isValid: false, totalSheetsProcessed: 0, issues: [{ code: 'MISSING_SCHEMA' as const, severity: 'CRITICAL' as const, sheet: 'Sheet1', message: 'bad', action: 'fix' }] };
    simulateWorkerMessage({ type: 'DIAGNOSTIC', report });
    simulateWorkerMessage({ type: 'RESULT', data: mockParsedData });

    await promise;

    expect(onDiagnostic).toHaveBeenCalledTimes(1);
    expect(onDiagnostic).toHaveBeenCalledWith(report);
  });

  it('transfers ArrayBuffer via transfer list (zero-copy)', async () => {
    const buffer = new ArrayBuffer(16);
    const file = new File([], 'dummy.xlsx');
    Object.defineProperty(file, 'arrayBuffer', {
      value: vi.fn().mockResolvedValue(buffer),
      writable: true
    });

    const promise = parseFileInWorker([file], {P1: 33.3, P2: 33.3, P3: 33.4}, {});
    await flushMicrotasks();

    const posted = mockWorkerPostMessage.mock.calls[0];
    // Verify transfer list includes the buffer (zero-copy intent)
    expect(posted[1]).toEqual([buffer]);
    // Note: buffer detaching (byteLength → 0) only happens in a real Worker;
    // our mock postMessage does not detach, but the transfer list proves intent

    simulateWorkerMessage({ type: 'RESULT', data: mockParsedData });
    await promise;
  });

  it('rejects when Worker constructor throws (fallback)', async () => {
    // Reset: current worker must be null for the next stub to take effect
    terminateWorker();

    const ThrowingWorker = vi.fn(function (this: unknown) {
      throw new Error('Workers not supported');
    }) as unknown as typeof Worker;
    vi.stubGlobal('Worker', ThrowingWorker);

    

    await expect(parseFileInWorker([], {P1: 33.3, P2: 33.3, P3: 33.4}, {})).rejects.toThrow('Workers not supported');
  });

  it('terminates previous worker on new upload', async () => {
    
    

    // Start first parse (no prior worker, so no terminate)
    const promise1 = parseFileInWorker([], {P1: 33.3, P2: 33.3, P3: 33.4}, {});
    await flushMicrotasks();
    expect(mockWorkerTerminate).not.toHaveBeenCalled();

    // Pre-attach the rejection assertion so the catch handler exists
    // before terminateWorker fires the rejection
    const rejectionAssertion = expect(promise1).rejects.toThrow('aborted');

    // Start second parse — this internally calls terminateWorker(),
    // which should abort the first parse's promise
    const promise2 = parseFileInWorker([], {P1: 33.3, P2: 33.3, P3: 33.4}, {});
    await flushMicrotasks();

    await rejectionAssertion;

    // Second parse should succeed
    simulateWorkerMessage({ type: 'RESULT', data: mockParsedData });
    await promise2;
  });
});
