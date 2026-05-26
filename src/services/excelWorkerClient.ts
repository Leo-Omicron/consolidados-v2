import type { ParsedExcelData, WorkerMessage, WorkerRequest } from './workerTypes';
import type { DiagnosticReport } from './excelParser';

// Re-export for consumers
export type { ParsedExcelData } from './workerTypes';

// ---------------------------------------------------------------------------
// Worker Client — phase17-web-worker
// ---------------------------------------------------------------------------
// Manages a singleton Web Worker that offloads Excel parsing from the UI
// thread.  Uses zero-copy ArrayBuffer transfer and supports progress /
// diagnostic callbacks.
// ---------------------------------------------------------------------------

export interface ParseCallbacks {
  onProgress?: (phase: string, message: string) => void;
  onDiagnostic?: (report: DiagnosticReport) => void;
}

interface PendingParse {
  resolve: (data: ParsedExcelData) => void;
  reject: (error: Error) => void;
}

let worker: Worker | null = null;
let currentResolve: PendingParse['resolve'] | null = null;
let currentReject: PendingParse['reject'] | null = null;

function createWorker(): Worker {
  return new Worker(
    new URL('./excelWorker.ts', import.meta.url),
    { type: 'module' }
  );
}

function getWorker(): Worker {
  if (!worker) {
    worker = createWorker();
  }
  return worker;
}

function setupWorkerListeners(
  callbacks?: ParseCallbacks
): { resolve: PendingParse['resolve']; reject: PendingParse['reject'] } {
  const w = getWorker();

  // Remove previous listeners by replacing the worker
  // (the onmessage listener is set via addEventListener so we'd need to track references.
  // Instead, we use a fresh handler approach: the worker reference is always the same,
  // so we need to clean up properly.)

  const handler = (e: MessageEvent<WorkerMessage>) => {
    const msg = e.data;
    switch (msg.type) {
      case 'PROGRESS':
        callbacks?.onProgress?.(msg.phase, msg.message);
        break;
      case 'DIAGNOSTIC':
        callbacks?.onDiagnostic?.(msg.report);
        break;
      case 'RESULT': {
        // Resolve only if we have a pending promise
        if (currentResolve) {
          const resolve = currentResolve;
          currentResolve = null;
          currentReject = null;
          w.removeEventListener('message', handler);
          resolve(msg.data);
        }
        break;
      }
      case 'ERROR': {
        if (currentReject) {
          const reject = currentReject;
          currentResolve = null;
          currentReject = null;
          w.removeEventListener('message', handler);
          reject(new Error(msg.message));
        }
        break;
      }
    }
  };

  w.addEventListener('message', handler);

  return {
    resolve: (data: ParsedExcelData) => {
      if (currentResolve) currentResolve(data);
    },
    reject: (err: Error) => {
      if (currentReject) currentReject(err);
    }
  };
}

/**
 * Parse an Excel file in a Web Worker.
 *
 * @param file      The Excel file to parse (.xlsx / .xls).
 * @param callbacks Optional progress and diagnostic callbacks.
 * @returns A promise that resolves with the complete parsed data.
 */
export async function parseFileInWorker(
  file: File,
  callbacks?: ParseCallbacks
): Promise<ParsedExcelData> {
  // Terminate any previous parse in flight
  terminateWorker();

  let w: Worker;
  try {
    w = getWorker();
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to create worker';
    throw new Error(message, { cause: err });
  }

  // Set up pending promise
  return new Promise<ParsedExcelData>((resolve, reject) => {
    currentResolve = resolve;
    currentReject = reject;

    setupWorkerListeners(callbacks);

    // Read file and transfer ArrayBuffer (zero-copy)
    file
      .arrayBuffer()
      .then((buffer) => {
        const request: WorkerRequest = {
          type: 'PARSE',
          fileData: buffer,
          fileName: file.name
        };
        w.postMessage(request, [buffer]);
      })
      .catch((err) => {
        currentResolve = null;
        currentReject = null;
        reject(
          err instanceof Error ? err : new Error('Failed to read file')
        );
      });
  });
}

/**
 * Terminate the current worker instance, aborting any in-flight parse.
 */
export function terminateWorker(): void {
  if (currentReject) {
    const reject = currentReject;
    currentResolve = null;
    currentReject = null;
    reject(new Error('aborted'));
  }

  if (worker) {
    worker.terminate();
    worker = null;
  }
}
