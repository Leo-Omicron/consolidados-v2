import type { Estudiante } from '../domain/types';
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

    // Find header row (the row containing "ESTUDIANTE")
    let headerRowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (normalizeText(rows[i]?.[1]) === 'ESTUDIANTE' || normalizeText(rows[i]?.[0]) === 'ESTUDIANTE') {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1 || headerRowIndex < 2) {
      issues.push({
        code: 'MISSING_SCHEMA',
        severity: 'CRITICAL',
        sheet: sheetName,
        message: `La hoja "${sheetName}" no contiene la estructura esperada (falta la fila de "ESTUDIANTE" o no tiene suficientes filas previas para jerarquía).`,
        action: 'Asegúrese de usar el reporte consolidado oficial.'
      });
      return;
    }

    // The validation could be extended here, but for now we trust the platform's format.
  });

  if (totalSheetsProcessed === 0) {
    issues.push({
      code: 'MISSING_SCHEMA',
      severity: 'CRITICAL',
      sheet: 'Global',
      message: 'No se encontraron hojas válidas para procesar en el archivo Excel.',
      action: 'Asegúrese de cargar un archivo Excel válido.'
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
  componente: string; // P1, P2, P3, P4, A, PRO, RAK, BAJ, BAS, ALT, SUP
}

export function normalizeText(t: unknown): string {
  if (typeof t !== 'string') return t ? String(t).trim() : '';
  return t.trim().replace(/\s+/g, ' ').toUpperCase();
}

/**
 * Parses the 3 header rows to construct valid headers.
 * The raw rows are from indices (headerRowIndex - 2), (headerRowIndex - 1), (headerRowIndex)
 */
export function parseHeaders(headerRows: unknown[][]): { headers: HeaderComponent[], totalPeriods: number } {
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

  // Omit the first two columns (ID and Name usually, but we filter dynamically)

  
  const structuredHeaders = headers.filter(h => h.area && h.componente);

  // Detect periods (max period)
  let totalPeriods = 3;
  if (structuredHeaders.some(h => h.componente === 'P4')) totalPeriods = 4;

  return { headers: structuredHeaders, totalPeriods };
}

function extractNumber(val: unknown): number | null {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const clean = val.replace('R:', '').trim().replace(',', '.');
    const parsed = parseFloat(clean);
    if (!isNaN(parsed)) return parsed;
  }
  return null;
}

export function extractStudents(dataRows: unknown[][], headers: HeaderComponent[], defaultCurso: string, defaultGrupo: string = '', director: string = '', sede: string = '', jornada: string = ''): Estudiante[] {
  const students: Estudiante[] = [];
  let lastStudent: Estudiante | null = null;

  dataRows.forEach((row) => {
    // Check if it's a recovery row (R:)
    const isRecoveryRow = row.some(cell => typeof cell === 'string' && cell.includes('R:'));
    
    if (isRecoveryRow && lastStudent) {
      // It's a recovery row, apply grades to last student
      headers.forEach(h => {
        const rawVal = row[h.index];
        if (typeof rawVal === 'string' && rawVal.includes('R:')) {
          const note = extractNumber(rawVal);
          if (note !== null && note >= 0 && note <= 5) {
            applyGradeToStudent(lastStudent!, h, note);
          }
        }
      });
      return; // done with this row
    }

    const id = normalizeText(row[0]);
    let name = normalizeText(row[1]);

    // Ignore summary rows at the bottom of the Excel sheet
    const firstCell = String(row[0] || '').trim().toUpperCase();
    if (['PROM. ASIGNATURA', 'BAJO', 'BASICO', 'ALTO', 'SUPERIOR', 'RAK: RANKING O PUESTO'].includes(firstCell) || firstCell.startsWith('ADMINISTRADOR:')) {
      return;
    }
    
    // If name is empty, it could be a garbage row, but we also check if it has valid ID in column 1 sometimes.
    if (!name && id && isNaN(Number(id))) {
       name = id; // Sometimes name is in the first column
    }

    if (!name) return;

    const student: Estudiante = {
      id: `${defaultGrupo || defaultCurso}-${id || name}`,
      name,
      CURSO: defaultCurso,
      grupo: defaultGrupo || defaultCurso,
      sede,
      jornada,
      director,
      areas: {},
      promedios: {},
      rankings: {},
      desempeños: {}
    };

    // Pre-initialize all areas and subjects to ensure they exist even if grades are empty
    headers.forEach(h => {
      if (['PRO', 'RAK', 'BAJ', 'BAS', 'ALT', 'SUP'].includes(h.area)) return;
      if (!student.areas[h.area]) {
        student.areas[h.area] = { asignaturas: {}, DEF: { P1: null, P2: null, P3: null, P4: null, A: null } };
      }
      if (h.asignatura !== 'DEF' && !student.areas[h.area].asignaturas[h.asignatura]) {
        student.areas[h.area].asignaturas[h.asignatura] = {
          P1: null, P2: null, P3: null, P4: null, A: null,
          promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' }
        };
      }
    });

    headers.forEach(h => {
      const rawVal = row[h.index];
      const note = extractNumber(rawVal);
      if (note !== null) {
        applyGradeToStudent(student, h, note);
      }
    });

    students.push(student);
    lastStudent = student;
  });

  return students;
}

function applyGradeToStudent(student: Estudiante, h: HeaderComponent, value: number) {
  const { area, asignatura, componente } = h;

  // Global Metrics
  if (area === 'PRO') {
    student.promedios![componente] = value;
    return;
  }
  if (area === 'RAK') {
    student.rankings![componente] = value;
    return;
  }
  if (['BAJ', 'BAS', 'ALT', 'SUP'].includes(area)) {
    if (!student.desempeños![componente]) {
      student.desempeños![componente] = { BAJ: 0, BAS: 0, ALT: 0, SUP: 0 };
    }
    // Typecast since we know area is one of the keys
    (student.desempeños![componente] as unknown as Record<string, number>)[area] = value;
    return;
  }

  // Academic Areas
  if (!student.areas[area]) {
    student.areas[area] = { asignaturas: {}, DEF: { P1: null, P2: null, P3: null, P4: null, A: null } };
  }

  // Determine if this is the Area DEF column
  const isPeriod = ['P1', 'P2', 'P3', 'P4', 'A', 'DEF'].includes(componente);
  // Only DEF explicitly marks the definitive area grade
  const isAreaDef = asignatura === 'DEF';

  if (isAreaDef) {
    if (isPeriod) {
      const compKey = componente === 'DEF' ? 'A' : componente; // Fallback
      if (['P1', 'P2', 'P3', 'P4', 'A'].includes(compKey)) {
        (student.areas[area].DEF as unknown as Record<string, number | null>)[compKey] = value;
      }
    }
  } else {
    if (!student.areas[area].asignaturas[asignatura]) {
      student.areas[area].asignaturas[asignatura] = {
        P1: null, P2: null, P3: null, P4: null, A: null,
        promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' }
      };
    }
    if (isPeriod) {
      const compKey = componente === 'DEF' ? 'A' : componente; // Fallback
      if (['P1', 'P2', 'P3', 'P4', 'A'].includes(compKey)) {
        (student.areas[area].asignaturas[asignatura] as unknown as Record<string, number | null>)[compKey] = value;
      }
    }
  }
}

export function parseWorkbook(workbook: XLSX.WorkBook, curso: string): Estudiante[] {
  let allStudents: Estudiante[] = [];

  workbook.SheetNames.forEach(sheetName => {
    if (normalizeText(sheetName) === 'RESUMEN') return;

    const worksheet = workbook.Sheets[sheetName];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (rows.length < 15) return; // Too short for the new format

    let headerRowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (normalizeText(rows[i]?.[1]) === 'ESTUDIANTE' || normalizeText(rows[i]?.[0]) === 'ESTUDIANTE') {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex < 2) return; // Invalid format

    // Try to extract group name, sede, and jornada from row 12 (index 12) if it contains "Consolidado Curso"
    let extractGrupo = curso;
    let extractSede = '';
    let extractJornada = '';
    
    for (let i = 0; i < headerRowIndex; i++) {
      const text = String(rows[i]?.find(c => typeof c === 'string' && c.includes('Consolidado Curso')) || '');
      if (text) {
        // e.g. "Consolidado Curso - Año 2026 - IE EL CARMEN SEDE PRINCIPAL - SEXTO UNO- Jornada Tarde"
        const parts = text.split('-');
        if (parts.length > 2) {
          const knownJornadas = ['MAÑANA', 'TARDE', 'NOCTURNA', 'SABATINA', 'UNICA'];
          
          const sedePart = parts.find(p => p.toUpperCase().includes('SEDE'));
          if (sedePart) {
            const match = sedePart.match(/SEDE\s+(.+)/i);
            extractSede = match ? match[1].trim() : sedePart.trim();
          }

          const jornadaPart = parts.find(p => {
            const upper = p.toUpperCase();
            return upper.includes('JORNADA') || knownJornadas.some(k => upper.includes(k));
          });
          if (jornadaPart) {
            const match = jornadaPart.match(/JORNADA\s+(.+)/i);
            if (match) {
              extractJornada = match[1].trim();
            } else {
              const upper = jornadaPart.toUpperCase();
              const found = knownJornadas.find(k => upper.includes(k));
              extractJornada = found ? found : jornadaPart.trim();
            }
          }

          const possibleGroups = parts.filter(p => {
            const upper = p.toUpperCase();
            return !upper.includes('CONSOLIDADO') && 
                   !upper.includes('AÑO') &&
                   !/\d{4}/.test(upper) &&
                   !upper.includes('SEDE') &&
                   !upper.includes('JORNADA') &&
                   !knownJornadas.some(k => upper.includes(k)) &&
                   !upper.includes('IE EL CARMEN');
          });
          if (possibleGroups.length > 0) {
            extractGrupo = possibleGroups[possibleGroups.length - 1].trim();
          }
        }
      }
    }

    // Try to extract director from A15 (index 14) or anywhere before headerRowIndex
    let extractDirector = 'Director de Curso';
    if (rows[14] && typeof rows[14][0] === 'string' && rows[14][0].toUpperCase().includes('DIRECTOR')) {
      extractDirector = rows[14][0].replace(/DIRECTOR DE GRUPO:/i, '').trim();
    } else {
      for (let i = 0; i < headerRowIndex; i++) {
        const text = String(rows[i]?.find(c => typeof c === 'string' && c.toUpperCase().includes('DIRECTOR')) || '');
        if (text) {
          extractDirector = text.replace(/DIRECTOR DE GRUPO:/i, '').trim();
          break;
        }
      }
    }

    const headerRows = [rows[headerRowIndex], rows[headerRowIndex + 1], rows[headerRowIndex + 2]];
    const dataRows = rows.slice(headerRowIndex + 3);

    const { headers } = parseHeaders(headerRows);
    const students = extractStudents(dataRows, headers, curso, extractGrupo, extractDirector, extractSede, extractJornada);
    
    allStudents = allStudents.concat(students);
  });

  return allStudents;
}

export function isLegacyFormat(rows: unknown[][]): boolean {
  if (rows.length < 3) return false;
  return normalizeText(rows[0]?.[1]) === 'ESTUDIANTE' || normalizeText(rows[0]?.[0]) === 'ESTUDIANTE';
}

export function parseLegacyFormat(workbook: XLSX.WorkBook, curso: string): Estudiante[] {
  let allStudents: Estudiante[] = [];

  workbook.SheetNames.forEach(sheetName => {
    if (normalizeText(sheetName) === 'RESUMEN') return;

    const worksheet = workbook.Sheets[sheetName];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (!isLegacyFormat(rows)) return;

    const headerRowIndex = 0; // Legacy format always has headers at row 0
    const extractGrupo = sheetName; // Use sheet name as fallback group, or curso
    const extractDirector = 'Director de Curso'; 

    const headerRows = [rows[headerRowIndex], rows[headerRowIndex + 1], rows[headerRowIndex + 2]];
    const dataRows = rows.slice(headerRowIndex + 3);

    const { headers } = parseHeaders(headerRows);
    const students = extractStudents(dataRows, headers, curso, extractGrupo, extractDirector);
    
    allStudents = allStudents.concat(students);
  });

  return allStudents;
}

