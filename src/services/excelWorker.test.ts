import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
import type { WorkerRequest, WorkerMessage, WorkerResult, WorkerDiagnostic, WorkerProgress } from './workerTypes';

// Mock dependencies BEFORE importing the worker module
vi.mock('xlsx', () => ({
  read: vi.fn(),
  utils: {
    sheet_to_json: vi.fn()
  }
}));

vi.mock('./excelParser', () => ({
  validateWorkbook: vi.fn(),
  parseWorkbook: vi.fn(),
  flattenRows: vi.fn(),
  parseHeaders: vi.fn(),
  extractStudents: vi.fn(),
  getColumnLetter: vi.fn(),
  normalizeText: vi.fn()
}));

vi.mock('./academicLogic', () => ({
  applyAcademicLogic: vi.fn(),
  inferSubjectWeights: vi.fn(),
  getEvaluatedPeriods: vi.fn(),
  getPresetWeights: vi.fn(),
  getAccumulatedWeightAndProduct: vi.fn()
}));

// Import the worker handler (pure function) and mocked deps
import { handleParse } from './excelWorker';
import * as excelParser from './excelParser';
import * as academicLogic from './academicLogic';

describe('excelWorker — handleParse', () => {
  let postMessageSpy: ReturnType<typeof vi.fn<(msg: WorkerMessage) => void>>;
  let mockWorkbook: unknown;
  let mockStudents: unknown[];
  let mockDiagnostic: unknown;

  beforeEach(() => {
    vi.clearAllMocks();
    postMessageSpy = vi.fn<(msg: WorkerMessage) => void>();

    mockWorkbook = { SheetNames: ['10A', '10B', 'RESUMEN'], Sheets: {} };
    mockStudents = [
      { id: '1', name: 'Alice', CURSO: 'test', grupo: '10A', areas: {} },
      { id: '2', name: 'Bob', CURSO: 'test', grupo: '10B', areas: {} }
    ];
    mockDiagnostic = {
      isValid: true,
      totalSheetsProcessed: 2,
      issues: [{ code: 'EMPTY_GRADE' as const, severity: 'WARNING' as const, sheet: '10A', col: 'C', row: 5, message: 'empty', action: 'fix' }]
    };

    // Default mock returns: successful pipeline
    (XLSX.read as ReturnType<typeof vi.fn>).mockReturnValue(mockWorkbook);
    (excelParser.validateWorkbook as ReturnType<typeof vi.fn>).mockReturnValue(mockDiagnostic);
    (excelParser.parseWorkbook as ReturnType<typeof vi.fn>).mockReturnValue(mockStudents);
    (academicLogic.inferSubjectWeights as ReturnType<typeof vi.fn>).mockReturnValue({ BIOLOGIA: 0.5, QUIMICA: 0.5 });
    (academicLogic.applyAcademicLogic as ReturnType<typeof vi.fn>).mockImplementation(() => {});
    (excelParser.flattenRows as ReturnType<typeof vi.fn>).mockReturnValue({
      rowsArea: [{ id: '1_CIENCIAS', CURSO: 'test', estudiante: 'Alice', area: 'CIENCIAS', grupo: '10A', defP1: 4.0, defP2: 3.5, defP3: null, promActual: 3.7, p4Min: 2.1, estado: { text: 'Recuperable', color: 'blue' }, CURSO_NORM: 'TEST', AREA_NORM: 'CIENCIAS', EST_NORM: 'ALICE' }],
      rowsAsignatura: []
    });
  });

  it('posts DIAGNOSTIC after workbook validation', async () => {
    const request: WorkerRequest = {
      type: 'PARSE',
      fileData: new ArrayBuffer(8),
      fileName: 'test.xlsx'
    };

    await handleParse(request, postMessageSpy);

    const diagnosticCall = postMessageSpy.mock.calls
      .map(c => c[0])
      .find((msg): msg is WorkerDiagnostic => msg.type === 'DIAGNOSTIC');

    expect(diagnosticCall).toBeDefined();
    expect(diagnosticCall!.type).toBe('DIAGNOSTIC');
    expect(diagnosticCall!.report).toBe(mockDiagnostic);
  });

  it('posts PROGRESS messages in order: reading → extracting → calculating → applying', async () => {
    const request: WorkerRequest = {
      type: 'PARSE',
      fileData: new ArrayBuffer(8),
      fileName: 'test.xlsx'
    };

    await handleParse(request, postMessageSpy);

    const progressCalls = postMessageSpy.mock.calls
      .map(c => c[0])
      .filter((msg): msg is WorkerProgress => msg.type === 'PROGRESS');

    expect(progressCalls).toHaveLength(4);

    // Order check: phase strings should appear in pipeline order
    const phases = progressCalls.map(p => p.phase);
    expect(phases[0]).toContain('Leyendo');
    expect(phases[1]).toContain('Extrayendo');
    expect(phases[2]).toContain('Calculando');
    expect(phases[3]).toContain('Aplicando');
  });

  it('posts RESULT with complete ParsedExcelData on success', async () => {
    const request: WorkerRequest = {
      type: 'PARSE',
      fileData: new ArrayBuffer(8),
      fileName: 'test.xlsx'
    };

    await handleParse(request, postMessageSpy);

    const resultCall = postMessageSpy.mock.calls
      .map(c => c[0])
      .find((msg): msg is WorkerResult => msg.type === 'RESULT');

    expect(resultCall).toBeDefined();
    const result = resultCall!.data;
    expect(result.estudiantes).toBe(mockStudents);
    expect(result.rowsArea).toHaveLength(1);
    expect(result.rowsAsignatura).toEqual([]);
    expect(result.availableGroups).toContain('Todos');
    expect(result.availableGroups).toContain('10A');
    expect(result.availableGroups).toContain('10B');
    expect(result.diagnosticReport).toBe(mockDiagnostic);
  });

  it('posts ERROR when XLSX.read throws (corrupt file)', async () => {
    const corruptError = new Error('Unsupported format');
    (XLSX.read as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw corruptError;
    });

    const request: WorkerRequest = {
      type: 'PARSE',
      fileData: new ArrayBuffer(8),
      fileName: 'corrupt.xlsx'
    };

    await handleParse(request, postMessageSpy);

    const errorCall = postMessageSpy.mock.calls
      .map(c => c[0])
      .find((msg): msg is WorkerMessage & { type: 'ERROR'; message: string } => msg.type === 'ERROR');

    expect(errorCall).toBeDefined();
    expect(errorCall!.type).toBe('ERROR');
    expect(errorCall!.message).toContain('Unsupported format');
    expect(errorCall!.stack).toBeDefined();
  });

  it('posts ERROR when no students are found', async () => {
    (excelParser.parseWorkbook as ReturnType<typeof vi.fn>).mockReturnValue([]);

    const request: WorkerRequest = {
      type: 'PARSE',
      fileData: new ArrayBuffer(8),
      fileName: 'empty.xlsx'
    };

    await handleParse(request, postMessageSpy);

    const errorCall = postMessageSpy.mock.calls
      .map(c => c[0])
      .find((msg): msg is WorkerMessage & { type: 'ERROR'; message: string } => msg.type === 'ERROR');

    expect(errorCall).toBeDefined();
    expect(errorCall!.message).toContain('No se encontraron estudiantes');
  });

  it('posts only DIAGNOSTIC when workbook is invalid (CRITICAL issues)', async () => {
    const criticalDiag = {
      isValid: false,
      totalSheetsProcessed: 0,
      issues: [{ code: 'MISSING_SCHEMA' as const, severity: 'CRITICAL' as const, sheet: 'Global', message: 'No hay hojas válidas', action: 'Use la plantilla' }]
    };
    (excelParser.validateWorkbook as ReturnType<typeof vi.fn>).mockReturnValue(criticalDiag);

    const request: WorkerRequest = {
      type: 'PARSE',
      fileData: new ArrayBuffer(8),
      fileName: 'bad.xlsx'
    };

    await handleParse(request, postMessageSpy);

    const diagnosticCall = postMessageSpy.mock.calls
      .map(c => c[0])
      .find((msg): msg is WorkerDiagnostic => msg.type === 'DIAGNOSTIC');
    expect(diagnosticCall).toBeDefined();
    expect(diagnosticCall!.report.isValid).toBe(false);

    // Should NOT post RESULT
    const resultCall = postMessageSpy.mock.calls
      .map(c => c[0])
      .find((msg): msg is WorkerResult => msg.type === 'RESULT');
    expect(resultCall).toBeUndefined();
  });

  it('posts RESULT with group-isolated subject weights', async () => {
    // Students in different groups
    const groupStudents = [
      { id: '1', name: 'Alice', CURSO: 'test', grupo: '6A', areas: { CIENCIAS: { asignaturas: {} } } },
      { id: '2', name: 'Bob', CURSO: 'test', grupo: '10A', areas: { CIENCIAS: { asignaturas: {} } } }
    ];
    (excelParser.parseWorkbook as ReturnType<typeof vi.fn>).mockReturnValue(groupStudents);

    const peso6A = { BIOLOGIA: 0.33, QUIMICA: 0.33, FISICA: 0.34 };
    const peso10A = { CIENCIAS_POLITICAS: 0.5, ECONOMIA: 0.5 };

    (academicLogic.inferSubjectWeights as ReturnType<typeof vi.fn>)
      .mockImplementation((students: unknown[], _area: string) => {
        const grupo = (students as Array<{ grupo: string }>)[0].grupo;
        return grupo === '6A' ? { ...peso6A } : { ...peso10A };
      });

    const request: WorkerRequest = {
      type: 'PARSE',
      fileData: new ArrayBuffer(8),
      fileName: 'groups.xlsx'
    };

    await handleParse(request, postMessageSpy);

    const resultCall = postMessageSpy.mock.calls
      .map(c => c[0])
      .find((msg): msg is WorkerResult => msg.type === 'RESULT');
    expect(resultCall).toBeDefined();
    const data = resultCall!.data;
    expect(data.subjectWeights['6A']).toBeDefined();
    expect(data.subjectWeights['10A']).toBeDefined();
    expect(data.subjectWeights['6A']['CIENCIAS']).toEqual(peso6A);
    expect(data.subjectWeights['10A']['CIENCIAS']).toEqual(peso10A);
  });
});
