import * as XLSX from 'xlsx';
import { validateWorkbook, parseWorkbook, isLegacyFormat, parseLegacyFormat } from './excelParser';
import { flattenRows } from './rowFlattener';
import { applyAcademicLogic, inferSubjectWeights } from './academicLogic';
import type { WorkerRequest, WorkerMessage } from './workerTypes';
import type { SubjectWeightConfig, Estudiante } from '../domain/types';

export async function handleParse(
  request: WorkerRequest,
  postMsg: (msg: WorkerMessage) => void
): Promise<void> {
  try {
    postMsg({ type: 'PROGRESS', phase: 'Leyendo archivos...', message: `Leyendo ${request.files.length} archivos Excel...` });

    let allStudents: Estudiante[] = [];
    const allDiagnosticIssues = [];
    let allValid = true;
    let sheetsProcessed = 0;

    for (let i = 0; i < request.files.length; i++) {
      const fileData = request.files[i];
      const workbook = XLSX.read(fileData.buffer, { type: 'array' });
      
      const curso = fileData.name.replace(/\.[^/.]+$/, '');
      const report = validateWorkbook(workbook);
      
      let isLegacy = false;
      if (!report.isValid) {
        // Check if ANY sheet matches legacy format
        isLegacy = workbook.SheetNames.some(sheetName => {
          if (sheetName.toUpperCase() === 'RESUMEN') return false;
          const ws = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
          return isLegacyFormat(rows as unknown[][]);
        });
      }

      if (isLegacy) {
        // Clean critical issues because we'll use legacy parser
        report.issues = report.issues.filter(i => i.severity !== 'CRITICAL');
        report.isValid = true;
      }
      
      sheetsProcessed += report.totalSheetsProcessed;
      if (!report.isValid) {
        allValid = false;
      }
      allDiagnosticIssues.push(...report.issues);

      const students = isLegacy ? parseLegacyFormat(workbook, curso) : parseWorkbook(workbook, curso);
      allStudents = allStudents.concat(students);
    }

    const combinedReport = {
      isValid: allValid,
      totalSheetsProcessed: sheetsProcessed,
      issues: allDiagnosticIssues
    };

    postMsg({ type: 'DIAGNOSTIC', report: combinedReport });

    if (!allValid) {
      const firstCritical = combinedReport.issues.find(i => i.severity === 'CRITICAL');
      const errorMessage = firstCritical
        ? firstCritical.message
        : 'Alguno de los archivos Excel no cumple con el esquema requerido.';
      postMsg({ type: 'ERROR', message: errorMessage });
      return;
    }

    if (allStudents.length === 0) {
      postMsg({ type: 'ERROR', message: 'No se encontraron estudiantes válidos en los archivos.' });
      return;
    }

    const uniqueGroupsSet = new Set<string>();
    allStudents.forEach(s => {
      if (s.grupo) uniqueGroupsSet.add(s.grupo);
    });
    const availableGroups = ['Todos', ...Array.from(uniqueGroupsSet).sort()];

    postMsg({ type: 'PROGRESS', phase: 'Calculando pesos...', message: 'Calculando ponderaciones por área...' });

    const groups = Array.from(uniqueGroupsSet);
    const inferredWeights: SubjectWeightConfig = {};

    groups.forEach(grupo => {
      inferredWeights[grupo] = {};
      const groupStudents = allStudents.filter(s => s.grupo === grupo);

      const groupAreas = new Set<string>();
      groupStudents.forEach(s => Object.keys(s.areas).forEach(a => groupAreas.add(a)));

      groupAreas.forEach(areaName => {
        inferredWeights[grupo][areaName] = inferSubjectWeights(groupStudents, areaName, grupo);
      });
    });

    postMsg({
      type: 'PROGRESS',
      phase: 'Aplicando lógica académica...',
      message: 'Calculando promedios, estados y requerimientos...'
    });

    const defaultConfig = { P1: 33.3, P2: 33.3, P3: 33.4 };
    applyAcademicLogic(allStudents, defaultConfig, inferredWeights);

    const { rowsArea, rowsAsignatura } = flattenRows(allStudents);

    postMsg({
      type: 'RESULT',
      data: {
        estudiantes: allStudents,
        rowsArea,
        rowsAsignatura,
        subjectWeights: inferredWeights,
        availableGroups,
        diagnosticReport: combinedReport
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error procesando los archivos';
    const stack = err instanceof Error ? err.stack : undefined;
    postMsg({ type: 'ERROR', message, stack });
  }
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  if (e.data.type === 'PARSE') {
    await handleParse(e.data, (msg: WorkerMessage) => self.postMessage(msg));
  }
};
