import type { DiagnosticReport } from './excelParser';
import type { Estudiante, RowArea, RowAsignatura, SubjectWeightConfig } from '../domain/types';

// ---------------------------------------------------------------------------
// Worker Protocol Types — phase17-web-worker
// ---------------------------------------------------------------------------
// These types define the message protocol between the main thread and the
// Web Worker responsible for offloading the Excel parsing pipeline.
// ---------------------------------------------------------------------------

/** Sent from main thread to worker to trigger a parse. */
export interface WorkerRequest {
  type: 'PARSE';
  fileData: ArrayBuffer;
  fileName: string;
}

/** Posted by worker to report pipeline progress. */
export interface WorkerProgress {
  type: 'PROGRESS';
  phase: string;
  message: string;
}

/** Posted by worker after workbook validation. */
export interface WorkerDiagnostic {
  type: 'DIAGNOSTIC';
  report: DiagnosticReport;
}

/** Posted by worker on successful parse completion. */
export interface WorkerResult {
  type: 'RESULT';
  data: ParsedExcelData;
}

/** Posted by worker when an unrecoverable error occurs. */
export interface WorkerError {
  type: 'ERROR';
  message: string;
  stack?: string;
}

/** Discriminated union of all messages a worker can send to the main thread. */
export type WorkerMessage = WorkerProgress | WorkerDiagnostic | WorkerResult | WorkerError;

/** Complete parsed data returned by the worker on success. */
export interface ParsedExcelData {
  estudiantes: Estudiante[];
  rowsArea: RowArea[];
  rowsAsignatura: RowAsignatura[];
  subjectWeights: SubjectWeightConfig;
  availableGroups: string[];
  diagnosticReport: DiagnosticReport;
}
