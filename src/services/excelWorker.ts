import * as XLSX from 'xlsx';
import { validateWorkbook, parseWorkbook, flattenRows } from './excelParser';
import { applyAcademicLogic, inferSubjectWeights } from './academicLogic';
import type { WorkerRequest, WorkerMessage } from './workerTypes';
import type { SubjectWeightConfig } from '../domain/types';

/**
 * Pure pipeline handler — receives a parse request and a postMessage callback.
 * Extracted so it can be tested without a WorkerGlobalScope.
 */
export async function handleParse(
  request: WorkerRequest,
  postMsg: (msg: WorkerMessage) => void
): Promise<void> {
  try {
    // 1. Read the workbook
    postMsg({ type: 'PROGRESS', phase: 'Leyendo archivo...', message: 'Leyendo el archivo Excel...' });

    const workbook = XLSX.read(request.fileData, { type: 'array' });

    // 2. Validate and post diagnostic
    const report = validateWorkbook(workbook);
    postMsg({ type: 'DIAGNOSTIC', report });

    if (!report.isValid) {
      const firstCritical = report.issues.find(i => i.severity === 'CRITICAL');
      const errorMessage = firstCritical
        ? firstCritical.message
        : 'El archivo Excel no cumple con el esquema requerido.';
      postMsg({ type: 'ERROR', message: errorMessage });
      return;
    }

    // 3. Parse students
    postMsg({ type: 'PROGRESS', phase: 'Extrayendo estudiantes...', message: 'Extrayendo datos de estudiantes...' });

    const curso = request.fileName.replace(/\.[^/.]+$/, '');
    const students = parseWorkbook(workbook, curso);

    if (students.length === 0) {
      postMsg({ type: 'ERROR', message: 'No se encontraron estudiantes válidos en el archivo.' });
      return;
    }

    // 4. Build available groups
    const uniqueGroupsSet = new Set<string>();
    students.forEach(s => {
      if (s.grupo) uniqueGroupsSet.add(s.grupo);
    });
    const availableGroups = ['Todos', ...Array.from(uniqueGroupsSet).sort()];

    // 5. Infer subject weights per group
    postMsg({ type: 'PROGRESS', phase: 'Calculando pesos...', message: 'Calculando ponderaciones por área...' });

    const groups = Array.from(uniqueGroupsSet);
    const inferredWeights: SubjectWeightConfig = {};

    groups.forEach(grupo => {
      inferredWeights[grupo] = {};
      const groupStudents = students.filter(s => s.grupo === grupo);

      const groupAreas = new Set<string>();
      groupStudents.forEach(s => Object.keys(s.areas).forEach(a => groupAreas.add(a)));

      groupAreas.forEach(areaName => {
        inferredWeights[grupo][areaName] = inferSubjectWeights(groupStudents, areaName);
      });
    });

    // 6. Apply academic logic
    postMsg({
      type: 'PROGRESS',
      phase: 'Aplicando lógica académica...',
      message: 'Calculando promedios, estados y requerimientos...'
    });

    // Use default config (same as store DEFAULT_CONFIG)
    const defaultConfig = { P1: 33.3, P2: 33.3, P3: 33.4 };
    applyAcademicLogic(students, defaultConfig, inferredWeights);

    // 7. Flatten rows
    const { rowsArea, rowsAsignatura } = flattenRows(students);

    // 8. Return result
    postMsg({
      type: 'RESULT',
      data: {
        estudiantes: students,
        rowsArea,
        rowsAsignatura,
        subjectWeights: inferredWeights,
        availableGroups,
        diagnosticReport: report
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error procesando el archivo';
    const stack = err instanceof Error ? err.stack : undefined;
    postMsg({ type: 'ERROR', message, stack });
  }
}

// ---------------------------------------------------------------------------
// Worker entry point — wraps handleParse in self.onmessage
// ---------------------------------------------------------------------------
self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  if (e.data.type === 'PARSE') {
    await handleParse(e.data, (msg: WorkerMessage) => self.postMessage(msg));
  }
};
