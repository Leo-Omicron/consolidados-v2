import type { Estudiante, RowArea, RowAsignatura } from '../domain/types';
import * as XLSX from 'xlsx';

export type DiagnosticSeverity = 'CRITICAL' | 'WARNING' | 'SUGGESTION';

export interface DiagnosticIssue {
  code: 'MISSING_SCHEMA' | 'MISSING_NAME' | 'INVALID_GRADE' | 'EMPTY_GRADE' | 'EMPTY_SHEET';
  severity: DiagnosticSeverity;
  sheet: string;
  row?: number; // 1-indexed
  col?: string; // Excel Column Letter (e.g., 'C')
  message: string;
  action: string;
}

export interface DiagnosticReport {
  isValid: boolean;
  totalSheetsProcessed: number;
  issues: DiagnosticIssue[];
}

export function getColumnLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

export function validateWorkbook(workbook: XLSX.WorkBook): DiagnosticReport {
  const issues: DiagnosticIssue[] = [];
  let totalSheetsProcessed = 0;

  workbook.SheetNames.forEach(sheetName => {
    if (normalizeText(sheetName) === 'RESUMEN') {
      return;
    }

    totalSheetsProcessed++;

    const worksheet = workbook.Sheets[sheetName];
    const hasRef = !!worksheet && !!worksheet['!ref'];
    const rows: unknown[][] = hasRef ? XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) : [];

    if (!hasRef || rows.length === 0) {
      issues.push({
        code: 'EMPTY_SHEET',
        severity: 'SUGGESTION',
        sheet: sheetName,
        message: `La hoja "${sheetName}" está vacía.`,
        action: 'Verifique si es necesario cargar calificaciones en esta hoja o elimínela si no contiene datos.'
      });
      return;
    }

    if (rows.length < 4) {
      issues.push({
        code: 'MISSING_SCHEMA',
        severity: 'CRITICAL',
        sheet: sheetName,
        message: `La hoja "${sheetName}" tiene menos de 4 filas y no cuenta con una estructura válida de encabezados y estudiantes.`,
        action: 'Asegúrese de usar la plantilla oficial con tres filas de encabezados y al menos una fila de estudiantes.'
      });
      return;
    }

    // Header Schema Scan (rows 0-2, col 0 and col 1)
    let hasCol0Header = false;
    let hasCol1Header = false;
    for (let i = 0; i < 3; i++) {
      const col0Val = normalizeText(rows[i]?.[0]);
      const col1Val = normalizeText(rows[i]?.[1]);
      if (['ID', '#', 'NO', 'N°'].includes(col0Val)) {
        hasCol0Header = true;
      }
      if (['NAME', 'ESTUDIANTE', 'NOMBRE'].includes(col1Val)) {
        hasCol1Header = true;
      }
    }

    if (!hasCol0Header || !hasCol1Header) {
      issues.push({
        code: 'MISSING_SCHEMA',
        severity: 'CRITICAL',
        sheet: sheetName,
        message: `La hoja "${sheetName}" no contiene los encabezados obligatorios de identificación ("ID" o "#") en la primera columna o de estudiante ("ESTUDIANTE" o "NOMBRE") en la segunda columna.`,
        action: 'Modifique las tres primeras filas de la hoja para incluir los encabezados correspondientes en las columnas A y B.'
      });
      return;
    }

    // Parse headers to detect period columns
    const headerRows = rows.slice(0, 3);
    const { headers } = parseHeaders(headerRows);
    const periodHeaders = headers.filter(h => ['P1', 'P2', 'P3', 'P4'].includes(h.componente));

    // Data rows scan
    const dataRows = rows.slice(3);
    dataRows.forEach((row, dataIdx) => {
      const rowIdx = dataIdx + 3; // 0-indexed in dataRows corresponds to row 3 in rows, so rowIdx is 0-indexed in rows
      const studentName = normalizeText(row[1]);

      // If name is blank but row is populated
      if (studentName === '') {
        const hasOtherValues = row.some((cell, colIdx) => colIdx !== 1 && cell !== null && cell !== undefined && String(cell).trim() !== '');
        if (hasOtherValues) {
          issues.push({
            code: 'MISSING_NAME',
            severity: 'WARNING',
            sheet: sheetName,
            row: rowIdx + 1, // 1-indexed for Excel
            col: 'B',
            message: `Fila ${rowIdx + 1} tiene datos pero tiene el nombre en blanco.`,
            action: 'Ingrese el nombre del estudiante correspondiente en la columna B o elimine la fila si es basura.'
          });
        }
      } else {
        // Validate grades for this student
        periodHeaders.forEach(h => {
          const cellVal = row[h.index];
          const colLetter = getColumnLetter(h.index);
          if (cellVal === null || cellVal === undefined || String(cellVal).trim() === '') {
            issues.push({
              code: 'EMPTY_GRADE',
              severity: 'WARNING',
              sheet: sheetName,
              row: rowIdx + 1,
              col: colLetter,
              message: `Calificación vacía en la celda ${colLetter}${rowIdx + 1} (${h.area} - ${h.asignatura} - ${h.componente}) para el estudiante "${studentName}".`,
              action: 'Ingrese una calificación válida entre 1.0 y 5.0 o deje un cero si corresponde.'
            });
          } else {
            let num: number;
            let isValidNumber = true;
            if (typeof cellVal === 'number') {
              num = cellVal;
            } else {
              const cleaned = String(cellVal).trim().replace(',', '.');
              num = parseFloat(cleaned);
              if (isNaN(num)) {
                isValidNumber = false;
              }
            }

            if (!isValidNumber) {
              issues.push({
                code: 'INVALID_GRADE',
                severity: 'WARNING',
                sheet: sheetName,
                row: rowIdx + 1,
                col: colLetter,
                message: `Calificación no es un número ("${cellVal}") en la celda ${colLetter}${rowIdx + 1} para el estudiante "${studentName}".`,
                action: 'Modifique el valor por un número decimal válido entre 1.0 y 5.0.'
              });
            } else if (num < 1.0 || num > 5.0) {
              issues.push({
                code: 'INVALID_GRADE',
                severity: 'WARNING',
                sheet: sheetName,
                row: rowIdx + 1,
                col: colLetter,
                message: `Calificación fuera de rango (${num}) en la celda ${colLetter}${rowIdx + 1} para el estudiante "${studentName}".`,
                action: 'Asegúrese de que la calificación esté entre 1.0 y 5.0.'
              });
            }
          }
        });
      }
    });
  });

  if (totalSheetsProcessed === 0) {
    issues.push({
      code: 'MISSING_SCHEMA',
      severity: 'CRITICAL',
      sheet: 'Global',
      message: 'No se encontraron hojas válidas para procesar en el archivo Excel.',
      action: 'Asegúrese de cargar un archivo Excel válido que contenga las hojas de los grupos (ej. 10A, 10B, etc.).'
    });
  }

  const isValid = !issues.some(i => i.severity === 'CRITICAL');

  return {
    isValid,
    totalSheetsProcessed,
    issues
  };
}

export interface HeaderComponent {
  index: number;
  area: string;
  asignatura: string;
  componente: string;
}

export function normalizeText(t: unknown): string {
  if (typeof t !== 'string') return t ? String(t).trim() : '';
  return t.trim().replace(/\s+/g, ' ').toUpperCase();
}

/**
 * Parses the top 3 rows of an XLSX to construct valid headers.
 * Implements forward-filling for merged cells in Excel.
 * Detects whether we have 3 or 4 periods dynamically.
 */
export function parseHeaders(headerRows: unknown[][]): { headers: HeaderComponent[], totalPeriods: number } {
  // Ensure same length
  const maxLen = Math.max(...headerRows.map(r => r.length));
  const [rawAreas, rawAsignaturas, rawComponentes] = headerRows.map(row => {
    const fullRow = [...row];
    while (fullRow.length < maxLen) fullRow.push(undefined);
    return fullRow;
  });

  // 1. Forward fill in Areas
  for (let i = 1; i < rawAreas.length; i++) {
    if (!normalizeText(rawAreas[i])) rawAreas[i] = rawAreas[i - 1];
  }

  // 2. Forward fill contextual in Asignaturas
  for (let i = 1; i < rawAsignaturas.length; i++) {
    if (!normalizeText(rawAsignaturas[i]) && normalizeText(rawAreas[i]) === normalizeText(rawAreas[i - 1])) {
      rawAsignaturas[i] = rawAsignaturas[i - 1];
    }
  }

  // 3. 1:1 fallback
  for (let i = 0; i < rawAsignaturas.length; i++) {
    if (!normalizeText(rawAsignaturas[i])) {
      rawAsignaturas[i] = rawAreas[i];
    }
  }

  const headers: HeaderComponent[] = rawComponentes.map((comp, i) => ({
    index: i,
    area: normalizeText(rawAreas[i]),
    asignatura: normalizeText(rawAsignaturas[i]),
    componente: normalizeText(comp)
  }));

  // Omit the first two columns (ID and Name)
  let structuredHeaders = headers.slice(2);
  structuredHeaders = structuredHeaders.filter(h => h.area && h.asignatura && h.componente);

  // Detect periods
  let hasP4 = false;
  structuredHeaders.forEach(h => {
    if (h.componente === 'P4') hasP4 = true;
  });

  return { headers: structuredHeaders, totalPeriods: hasP4 ? 4 : 3 };
}

export function extractStudents(dataRows: unknown[][], headers: HeaderComponent[], curso: string, grupo: string = ''): Estudiante[] {
  const students: Estudiante[] = [];

  dataRows.forEach(row => {
    const id = normalizeText(row[0]);
    const name = normalizeText(row[1]);
    
    if (!name) return;

    const student: Estudiante = {
      id: id || name,
      name,
      CURSO: curso,
      grupo: grupo || curso,
      areas: {}
    };

    headers.forEach(h => {
      const { area, asignatura, componente, index } = h;
      if (!student.areas[area]) {
        student.areas[area] = { asignaturas: {}, DEF: { P1: null, P2: null, P3: null, P4: null } };
      }

      const rawVal = row[index];
      let note: number | null = null;
      if (typeof rawVal === 'number') {
        note = rawVal;
      } else if (typeof rawVal === 'string') {
        const parsed = parseFloat(rawVal.replace(',', '.'));
        if (!isNaN(parsed)) note = parsed;
      }
      
      if (note !== null && (note < 0 || note > 5)) {
        note = null;
      }

      // Check if it's an expected component P1-P4
      const isPeriod = ['P1', 'P2', 'P3', 'P4'].includes(componente);

      const areaHasDefColumn = headers.some(h => h.area === area && h.asignatura === 'DEF');
      const isAreaDef = asignatura === 'DEF' || (!areaHasDefColumn && asignatura === area);

      if (isAreaDef) {
        // It's the area's DEF
        if (isPeriod) {
          const compKey = componente as 'P1' | 'P2' | 'P3' | 'P4';
          student.areas[area].DEF[compKey] = note;
        }
      } else {
        if (!student.areas[area].asignaturas[asignatura]) {
          student.areas[area].asignaturas[asignatura] = {
            P1: null, P2: null, P3: null, P4: null,
            promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' }
          };
        }
        if (isPeriod) {
          const compKey = componente as 'P1' | 'P2' | 'P3' | 'P4';
          student.areas[area].asignaturas[asignatura][compKey] = note;
        }
      }
    });

    students.push(student);
  });

  return students;
}

export function flattenRows(students: Estudiante[]): { rowsArea: RowArea[], rowsAsignatura: RowAsignatura[] } {
  const rowsArea: RowArea[] = [];
  const rowsAsignatura: RowAsignatura[] = [];

  students.forEach(student => {
    Object.entries(student.areas).forEach(([areaName, areaData]) => {
      if (areaData.areaStats) {
        rowsArea.push({
          id: `${student.id}_${areaName}`,
          CURSO: student.CURSO,
          estudiante: student.name,
          area: areaName,
          grupo: student.grupo,
          defP1: areaData.DEF.P1,
          defP2: areaData.DEF.P2,
          defP3: areaData.DEF.P3,
          defP4: areaData.DEF.P4,
          promActual: areaData.areaStats.promedioActual,
          p4Min: areaData.areaStats.p4Min,
          estado: areaData.areaStats.estado,
          CURSO_NORM: student.CURSO.toUpperCase(),
          AREA_NORM: areaName.toUpperCase(),
          EST_NORM: student.name.toUpperCase()
        });
      }

      const asigEntries = Object.entries(areaData.asignaturas);
      
      if (asigEntries.length > 0) {
        asigEntries.forEach(([asigName, asigData]) => {
          rowsAsignatura.push({
            id: `${student.id}_${areaName}_${asigName}`,
            CURSO: student.CURSO,
            estudiante: student.name,
            area: areaName,
            asignatura: asigName,
            grupo: student.grupo,
            p1: asigData.P1,
            p2: asigData.P2,
            p3: asigData.P3,
            p4: asigData.P4,
            promActual: asigData.promedioActual,
            p4Min: asigData.p4Min,
            estado: asigData.estado,
            CURSO_NORM: student.CURSO.toUpperCase(),
            AREA_NORM: areaName.toUpperCase(),
            ASIG_NORM: asigName.toUpperCase(),
            EST_NORM: student.name.toUpperCase()
          });
        });
      } else if (areaData.areaStats) {
        rowsAsignatura.push({
          id: `${student.id}_${areaName}_${areaName}`,
          CURSO: student.CURSO,
          estudiante: student.name,
          area: areaName,
          asignatura: areaName,
          grupo: student.grupo,
          p1: areaData.DEF.P1,
          p2: areaData.DEF.P2,
          p3: areaData.DEF.P3,
          p4: areaData.DEF.P4,
          promActual: areaData.areaStats.promedioActual,
          p4Min: areaData.areaStats.p4Min,
          estado: areaData.areaStats.estado,
          CURSO_NORM: student.CURSO.toUpperCase(),
          AREA_NORM: areaName.toUpperCase(),
          ASIG_NORM: areaName.toUpperCase(),
          EST_NORM: student.name.toUpperCase()
        });
      }
    });
  });

  return { rowsArea, rowsAsignatura };
}

export function parseWorkbook(workbook: XLSX.WorkBook, curso: string): Estudiante[] {
  let allStudents: Estudiante[] = [];

  workbook.SheetNames.forEach(sheetName => {
    if (normalizeText(sheetName) === 'RESUMEN') {
      return;
    }

    const worksheet = workbook.Sheets[sheetName];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (rows.length < 4) {
      return; // Skip invalid sheets
    }

    const headerRows = rows.slice(0, 3);
    const dataRows = rows.slice(3);

    const { headers } = parseHeaders(headerRows);
    const students = extractStudents(dataRows, headers, curso, sheetName);
    
    allStudents = allStudents.concat(students);
  });

  return allStudents;
}
