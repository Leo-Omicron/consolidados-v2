import type { ParsedExcelData, WorkerMessage, WorkerRequest, FileData } from './workerTypes';
import type { DiagnosticReport } from './excelParser';

export type { ParsedExcelData } from './workerTypes';

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

export async function parseFileInWorker(
  files: File[],
  config: import('../domain/types').PeriodConfig,
  subjectWeights: import('../domain/types').SubjectWeightConfig,
  callbacks?: ParseCallbacks
): Promise<ParsedExcelData> {
  terminateWorker();

  let w: Worker;
  try {
    w = getWorker();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create worker';
    throw new Error(message, { cause: err });
  }

  return new Promise<ParsedExcelData>((resolve, reject) => {
    currentResolve = resolve;
    currentReject = reject;

    setupWorkerListeners(callbacks);

    Promise.all(
      files.map(file => 
        file.arrayBuffer().then(buffer => ({ buffer, name: file.name } as FileData))
      )
    ).then(fileDatas => {
      const buffers = fileDatas.map(fd => fd.buffer);
      const request: WorkerRequest = {
        type: 'PARSE',
        files: fileDatas,
        config,
        subjectWeights
      };
      w.postMessage(request, buffers);
    }).catch(err => {
      currentResolve = null;
      currentReject = null;
      reject(err instanceof Error ? err : new Error('Failed to read files'));
    });
  });
}

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
