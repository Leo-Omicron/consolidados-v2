import { describe, it, expect } from 'vitest';
import type {
  WorkerRequest,
  WorkerProgress,
  WorkerDiagnostic,
  WorkerResult,
  WorkerError,
  WorkerMessage,
  ParsedExcelData
} from './workerTypes';
import type { DiagnosticReport } from './excelParser';
import type { Estudiante, RowArea, SubjectWeightConfig } from '../domain/types';

describe('workerTypes — discriminated union protocol', () => {
  const mockDiagnostic: DiagnosticReport = {
    isValid: true,
    totalSheetsProcessed: 2,
    issues: []
  };

  const mockParsed: ParsedExcelData = {
    estudiantes: [],
    rowsArea: [],
    rowsAsignatura: [],
    subjectWeights: {},
    availableGroups: [],
    diagnosticReport: mockDiagnostic
  };

  it('WorkerRequest has PARSE type with ArrayBuffer and fileName', () => {
    const buffer = new ArrayBuffer(8);
    const req: WorkerRequest = {
      type: 'PARSE',
      fileData: buffer,
      fileName: 'test.xlsx'
    };
    expect(req.type).toBe('PARSE');
    expect(req.fileData).toBe(buffer);
    expect(req.fileName).toBe('test.xlsx');
  });

  it('WorderProgress carries phase and message', () => {
    const prog: WorkerProgress = {
      type: 'PROGRESS',
      phase: 'Leyendo archivo...',
      message: '10%'
    };
    expect(prog.type).toBe('PROGRESS');
    expect(prog.phase).toBe('Leyendo archivo...');
    expect(prog.message).toBe('10%');
  });

  it('WorkerDiagnostic carries diagnostic report', () => {
    const diag: WorkerDiagnostic = {
      type: 'DIAGNOSTIC',
      report: mockDiagnostic
    };
    expect(diag.type).toBe('DIAGNOSTIC');
    expect(diag.report).toBe(mockDiagnostic);
  });

  it('WorkerResult carries ParsedExcelData with all fields', () => {
    const result: WorkerResult = {
      type: 'RESULT',
      data: mockParsed
    };
    expect(result.type).toBe('RESULT');
    expect(result.data.estudiantes).toEqual([]);
    expect(result.data.subjectWeights).toEqual({});
  });

  it('WorkerError carries message and optional stack', () => {
    const errWithStack: WorkerError = {
      type: 'ERROR',
      message: 'something went wrong',
      stack: 'at Worker.onmessage (excelWorker.ts:42)'
    };
    expect(errWithStack.type).toBe('ERROR');
    expect(errWithStack.message).toBe('something went wrong');
    expect(errWithStack.stack).toContain('excelWorker.ts');

    const errNoStack: WorkerError = {
      type: 'ERROR',
      message: 'parse failed'
    };
    expect(errNoStack.type).toBe('ERROR');
    expect(errNoStack.message).toBe('parse failed');
    expect(errNoStack.stack).toBeUndefined();
  });

  it('WorkerMessage discriminated union accepts all message types', () => {
    const messages: WorkerMessage[] = [
      { type: 'PROGRESS', phase: 'reading', message: '10%' },
      { type: 'DIAGNOSTIC', report: mockDiagnostic },
      { type: 'RESULT', data: mockParsed },
      { type: 'ERROR', message: 'fail' }
    ];
    expect(messages).toHaveLength(4);
    expect(messages[0].type).toBe('PROGRESS');
    expect(messages[3].type).toBe('ERROR');
  });

  it('ParsedExcelData supports non-empty arrays and populated weights', () => {
    const weights: SubjectWeightConfig = {
      '10A': { 'CIENCIAS': { 'BIOLOGIA': 0.5, 'QUIMICA': 0.5 } }
    };
    const estudiante: Estudiante = {
      id: '1',
      name: 'Alice',
      CURSO: 'test',
      grupo: '10A',
      areas: {}
    };
    const rowArea: RowArea = {
      id: '1_CIENCIAS',
      CURSO: 'test',
      estudiante: 'Alice',
      area: 'CIENCIAS',
      grupo: '10A',
      defP1: 4.0,
      defP2: 3.5,
      defP3: null,
      promActual: 3.7,
      p4Min: 2.1,
      estado: { text: 'Recuperable', color: 'blue' },
      CURSO_NORM: 'TEST',
      AREA_NORM: 'CIENCIAS',
      EST_NORM: 'ALICE'
    };

    const data: ParsedExcelData = {
      estudiantes: [estudiante],
      rowsArea: [rowArea],
      rowsAsignatura: [],
      subjectWeights: weights,
      availableGroups: ['Todos', '10A'],
      diagnosticReport: mockDiagnostic
    };

    expect(data.estudiantes).toHaveLength(1);
    expect(data.rowsArea).toHaveLength(1);
    expect(data.availableGroups).toContain('10A');
    expect(data.subjectWeights['10A']).toBeDefined();
  });
});
