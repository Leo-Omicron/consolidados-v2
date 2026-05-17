import { Area, Asignatura, Estudiante, PeriodoNotas, RowArea, RowAsignatura } from '../domain/types';

export interface HeaderComponent {
  index: number;
  area: string;
  asignatura: string;
  componente: string;
}

export function normalizeText(t: any): string {
  if (typeof t !== 'string') return t ? String(t).trim() : '';
  return t.trim().replace(/\s+/g, ' ').toUpperCase();
}

/**
 * Parses the top 3 rows of an XLSX to construct valid headers.
 * Implements forward-filling for merged cells in Excel.
 * Detects whether we have 3 or 4 periods dynamically.
 */
export function parseHeaders(headerRows: any[][]): { headers: HeaderComponent[], totalPeriods: number } {
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

export function extractStudents(dataRows: any[][], headers: HeaderComponent[], curso: string): Estudiante[] {
  const students: Estudiante[] = [];

  dataRows.forEach(row => {
    const id = normalizeText(row[0]);
    const name = normalizeText(row[1]);
    
    if (!name) return;

    const student: Estudiante = {
      id: id || name,
      name,
      CURSO: curso,
      areas: {}
    };

    headers.forEach(h => {
      const { area, asignatura, componente, index } = h;
      if (!student.areas[area]) {
        student.areas[area] = { asignaturas: {}, DEF: { P1: null, P2: null, P3: null, P4: null } };
      }

      let rawVal = row[index];
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

      if (asignatura === 'DEF' || asignatura === area) {
        // It's the area's DEF
        if (isPeriod) {
          (student.areas[area].DEF as any)[componente] = note;
        }
      } else {
        if (!student.areas[area].asignaturas[asignatura]) {
          student.areas[area].asignaturas[asignatura] = {
            P1: null, P2: null, P3: null, P4: null,
            promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' }
          };
        }
        if (isPeriod) {
          (student.areas[area].asignaturas[asignatura] as any)[componente] = note;
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

      Object.entries(areaData.asignaturas).forEach(([asigName, asigData]) => {
        rowsAsignatura.push({
          id: `${student.id}_${areaName}_${asigName}`,
          CURSO: student.CURSO,
          estudiante: student.name,
          area: areaName,
          asignatura: asigName,
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
    });
  });

  return { rowsArea, rowsAsignatura };
}
