import { describe, it, expect, vi } from 'vitest';
import * as XLSX from 'xlsx';
import { parseHeaders, extractStudents, parseWorkbook, getColumnLetter, validateWorkbook } from './excelParser';
import { flattenRows } from './rowFlattener';
import type { HeaderComponent } from './excelParser';
import type { Estudiante } from '../domain/types';

describe('excelParser', () => {
  describe('parseHeaders', () => {
    it('forward-fills missing area and subject cells', () => {
      const headerRows = [
        ['No', 'Estudiante', 'CIENCIAS', undefined, undefined, 'MATEMATICAS'],
        ['', '', 'BIOLOGIA', 'QUIMICA', 'FISICA', 'ALGEBRA'],
        ['', '', 'P1', 'P1', 'P1', 'P1']
      ];

      const { headers, totalPeriods } = parseHeaders(headerRows);
      
      expect(totalPeriods).toBe(3); // no P4 found
      expect(headers.length).toBe(4);
      
      expect(headers[0].area).toBe('CIENCIAS');
      expect(headers[0].asignatura).toBe('BIOLOGIA');
      expect(headers[0].componente).toBe('P1');

      expect(headers[1].area).toBe('CIENCIAS'); // Forward filled
      expect(headers[1].asignatura).toBe('QUIMICA');

      expect(headers[3].area).toBe('MATEMATICAS');
      expect(headers[3].asignatura).toBe('ALGEBRA');
    });

    it('detects 4 periods if P4 is present', () => {
      const headerRows = [
        ['No', 'Estudiante', 'CIENCIAS'],
        ['', '', 'BIOLOGIA'],
        ['', '', 'P4']
      ];

      const { headers, totalPeriods } = parseHeaders(headerRows);
      expect(totalPeriods).toBe(4);
      expect(headers[0].componente).toBe('P4');
    });
  });

  describe('extractStudents', () => {
    it('maps raw rows into nested Estudiante structures', () => {
      const headers: HeaderComponent[] = [
        { index: 2, area: 'CIENCIAS', asignatura: 'BIOLOGIA', componente: 'P1' },
        { index: 3, area: 'CIENCIAS', asignatura: 'BIOLOGIA', componente: 'P2' },
        { index: 4, area: 'CIENCIAS', asignatura: 'DEF', componente: 'P1' },
      ];

      const dataRows = [
        [1, 'Juan Perez', 4.0, 3.5, 4.0]
      ];

      const students = extractStudents(dataRows, headers, '10A');
      expect(students.length).toBe(1);
      
      const juan = students[0];
      expect(juan.name).toBe('JUAN PEREZ');
      expect(juan.areas['CIENCIAS']).toBeDefined();
      expect(juan.areas['CIENCIAS'].asignaturas['BIOLOGIA']).toBeDefined();
      
      // Asignatura
      expect(juan.areas['CIENCIAS'].asignaturas['BIOLOGIA'].P1).toBe(4.0);
      expect(juan.areas['CIENCIAS'].asignaturas['BIOLOGIA'].P2).toBe(3.5);
      
      // Area DEF
      expect(juan.areas['CIENCIAS'].DEF.P1).toBe(4.0);
    });

    it('stores out of range grades as-is (downstream logic handles clamping)', () => {
      const headers: HeaderComponent[] = [
        { index: 2, area: 'C1', asignatura: 'A1', componente: 'P1' }
      ];
      const dataRows = [[1, 'Pepe', 5.1]]; // Out-of-range grade

      const students = extractStudents(dataRows, headers, '10A');
      // The parser stores grades as-is; academic logic handles clamping
      expect(students[0].areas['C1'].asignaturas['A1'].P1).toBe(5.1);
    });

    it('dynamic DEF column detection: parses asignatura as core subject if a dedicated DEF column is present', () => {
      const headers: HeaderComponent[] = [
        { index: 2, area: 'MATEMATICAS', asignatura: 'MATEMATICAS', componente: 'P1' },
        { index: 3, area: 'MATEMATICAS', asignatura: 'DEF', componente: 'P1' }
      ];
      const dataRows = [
        [1, 'Juan Perez', 4.5, 3.8]
      ];

      const students = extractStudents(dataRows, headers, '10A', '10A');
      expect(students.length).toBe(1);
      const juan = students[0];

      // Since there is a dedicated 'DEF' column under MATEMATICAS, 
      // the MATEMATICAS column (where asignatura === area) must be parsed as a regular subject:
      expect(juan.areas['MATEMATICAS'].asignaturas['MATEMATICAS']).toBeDefined();
      expect(juan.areas['MATEMATICAS'].asignaturas['MATEMATICAS'].P1).toBe(4.5);

      // And the 'DEF' column must be parsed as the area's DEF average:
      expect(juan.areas['MATEMATICAS'].DEF.P1).toBe(3.8);
    });

    it('dynamic DEF column detection: pre-initializes asignatura even when no DEF column is present', () => {
      const headers: HeaderComponent[] = [
        { index: 2, area: 'ETICA', asignatura: 'ETICA', componente: 'P1' }
      ];
      const dataRows = [
        [1, 'Juan Perez', 5.0]
      ];

      const students = extractStudents(dataRows, headers, '10A', '10A');
      expect(students.length).toBe(1);
      const juan = students[0];

      // Pre-initialization creates the subject from headers
      // Since asignatura !== 'DEF', it becomes a subject entry
      expect(juan.areas['ETICA'].asignaturas['ETICA']).toBeDefined();
      expect(juan.areas['ETICA'].asignaturas['ETICA'].P1).toBe(5.0);
    });
  });

  describe('flattenRows', () => {
    it('flattens nested entities into RowArea and RowAsignatura arrays', () => {
      const students: Estudiante[] = [
        {
          id: '1',
          name: 'JUAN',
          CURSO: '10A',
          grupo: '10A',
          areas: {
            'MATEMATICAS': {
              DEF: { P1: 4.0, P2: null, P3: null },
              areaStats: { promedioActual: 4.0, p4Min: 3.0, estado: { text: 'Ganable', color: 'cyan' } },
              asignaturas: {
                'ALGEBRA': {
                  P1: 4.0, P2: null, P3: null,
                  promedioActual: 4.0, p4Min: 3.0, estado: { text: 'Ganable', color: 'cyan' }
                }
              }
            }
          }
        }
      ];

      const { rowsArea, rowsAsignatura } = flattenRows(students);
      
      expect(rowsArea.length).toBe(1);
      expect(rowsArea[0].area).toBe('MATEMATICAS');
      expect(rowsArea[0].promActual).toBe(4.0);
      expect(rowsArea[0].estado.text).toBe('Ganable');

      expect(rowsAsignatura.length).toBe(1);
      expect(rowsAsignatura[0].asignatura).toBe('ALGEBRA');
      expect(rowsAsignatura[0].p1).toBe(4.0);
    });
  });

  describe('parseWorkbook', () => {
    it('iterates through all sheets except Resumen and assigns sheet name to grupo', () => {
      // The parser searches for the row containing "ESTUDIANTE" in column 0 or 1
      // Then uses headerRowIndex-2, headerRowIndex-1, headerRowIndex as 3 header rows
      // Then dataRows start at headerRowIndex+1
      //
      // So we need:
      //   row[X-2] = areas
      //   row[X-1] = subjects  
      //   row[X]   = has "Estudiante" in col 0 or 1, plus components (P1, etc.)
      //   row[X+1..] = data rows
      //
      // BUT: parseWorkbook also reads headerRows as [rows[headerRowIndex], rows[headerRowIndex + 1], rows[headerRowIndex + 2]]
      // Wait, let me re-read the code...

      // From the actual code (lines 352-353):
      //   const headerRows = [rows[headerRowIndex], rows[headerRowIndex + 1], rows[headerRowIndex + 2]];
      //   const dataRows = rows.slice(headerRowIndex + 3);
      //
      // And the header search (line 317):
      //   if (normalizeText(rows[i]?.[1]) === 'ESTUDIANTE' || normalizeText(rows[i]?.[0]) === 'ESTUDIANTE')
      //     headerRowIndex = i;
      //
      // And line 323: if (headerRowIndex < 2) return; // needs at least 2 rows before
      //
      // So for the 3-row parseHeaders, the parser expects:
      //   rows[headerRowIndex]   = first header row (areas)
      //   rows[headerRowIndex+1] = second header row (subjects)
      //   rows[headerRowIndex+2] = third header row (components/periods)
      //
      // But wait - the "Estudiante" keyword IS in the first header row (headerRowIndex).
      // That's the row the search finds. So:
      //   rows[headerRowIndex] = ['No', 'Estudiante', 'CIENCIAS', ...]   ← AREAS
      //   rows[headerRowIndex+1] = ['', '', 'BIOLOGIA', 'DEF']          ← SUBJECTS
      //   rows[headerRowIndex+2] = ['', '', 'P1', 'P1']                 ← COMPONENTS

      const makeSheet = (studentName: string, studentId: number, groupName: string): unknown[][] => {
        const rows: unknown[][] = [];
        // Pad to ensure 15+ rows and headerRowIndex >= 2
        for (let i = 0; i < 2; i++) rows.push(['']); // rows 0,1
        // Row 2: Add group metadata that parser uses to extract group
        rows.push([`Consolidado Curso - Año 2026 - IE EL CARMEN SEDE PRINCIPAL - ${groupName} - Jornada Tarde`]);
        // headerRowIndex = 3 (>= 2, valid)
        rows.push(['No', 'Estudiante', 'CIENCIAS', undefined]); // row 3 - areas
        rows.push(['', '', 'BIOLOGIA', 'DEF']);                  // row 4 - subjects
        rows.push(['', '', 'P1', 'P1']);                         // row 5 - components
        rows.push([studentId, studentName, 4.0, 4.0]);           // row 6 - data
        // Pad to 15+ rows total
        for (let i = 0; i < 9; i++) rows.push(['']);
        return rows;
      };

      const mockWorkbook = {
        SheetNames: ['6A', 'Resumen', '6B'],
        Sheets: {
          '6A': {},
          'Resumen': {},
          '6B': {}
        }
      };

      const spy = vi.spyOn(XLSX.utils, 'sheet_to_json').mockImplementation((sheet) => {
        if (sheet === mockWorkbook.Sheets['6A']) {
          return makeSheet('Alice', 1, '6A');
        }
        if (sheet === mockWorkbook.Sheets['6B']) {
          return makeSheet('Bob', 2, '6B');
        }
        return [];
      });

      const students = parseWorkbook(mockWorkbook as any, 'Sexto');
      
      expect(students.length).toBe(2);
      
      const alice = students.find((s: Estudiante) => s.name === 'ALICE');
      expect(alice).toBeDefined();
      expect(alice?.grupo).toBe('6A');
      expect(alice?.CURSO).toBe('Sexto');

      const bob = students.find((s: Estudiante) => s.name === 'BOB');
      expect(bob).toBeDefined();
      expect(bob?.grupo).toBe('6B');
      expect(bob?.CURSO).toBe('Sexto');

      // Resumen sheet should be ignored
      expect(spy).toHaveBeenCalledTimes(2); // Only called for 6A and 6B
      
      spy.mockRestore();
    });
  });

  describe('getColumnLetter', () => {
    it('converts column index to Excel column letter', () => {
      expect(getColumnLetter(0)).toBe('A');
      expect(getColumnLetter(25)).toBe('Z');
      expect(getColumnLetter(26)).toBe('AA');
      expect(getColumnLetter(27)).toBe('AB');
      expect(getColumnLetter(701)).toBe('ZZ');
      expect(getColumnLetter(702)).toBe('AAA');
    });
  });

  describe('validateWorkbook', () => {
    // Helper: builds a minimal valid sheet with the dynamic header structure
    const buildValidSheetRows = (extraDataRows: unknown[][] = []) => {
      const rows: unknown[][] = [];
      // rows 0,1,2: padding (headerRowIndex must be >= 2)
      rows.push(['']);
      rows.push(['']);
      rows.push(['']);
      // row 3: area row (also has "Estudiante" keyword)
      rows.push(['No', 'Estudiante', 'CIENCIAS']);
      // row 4: subject row
      rows.push(['', '', 'BIOLOGIA']);
      // row 5: component row
      rows.push(['', '', 'P1']);
      // data rows
      extraDataRows.forEach(r => rows.push(r));
      return rows;
    };

    it('identifies completely empty workbook or missing sheets (CRITICAL MISSING_SCHEMA)', () => {
      const mockWorkbook: XLSX.WorkBook = {
        SheetNames: [],
        Sheets: {}
      };
      const report = validateWorkbook(mockWorkbook);
      expect(report.isValid).toBe(false);
      expect(report.totalSheetsProcessed).toBe(0);
      expect(report.issues[0]).toEqual(expect.objectContaining({
        code: 'MISSING_SCHEMA',
        severity: 'CRITICAL',
        sheet: 'Global',
        message: expect.stringContaining('No se encontraron hojas')
      }));
    });

    it('identifies sheet with no ESTUDIANTE row (CRITICAL MISSING_SCHEMA)', () => {
      const mockWorkbook: XLSX.WorkBook = {
        SheetNames: ['6A'],
        Sheets: {
          '6A': {
            '!ref': 'A1:C2'
          }
        }
      };
      const spy = vi.spyOn(XLSX.utils, 'sheet_to_json').mockReturnValue([
        ['ID', 'Nombre', 'P1'],
        ['', '', 'BIOLOGIA']
      ]);

      const report = validateWorkbook(mockWorkbook);
      expect(report.isValid).toBe(false);
      expect(report.issues[0]).toEqual(expect.objectContaining({
        code: 'MISSING_SCHEMA',
        severity: 'CRITICAL',
        sheet: '6A'
      }));
      spy.mockRestore();
    });

    it('identifies sheet missing ESTUDIANTE keyword in expected position (CRITICAL MISSING_SCHEMA)', () => {
      const mockWorkbook: XLSX.WorkBook = {
        SheetNames: ['6A'],
        Sheets: {
          '6A': {
            '!ref': 'A1:C5'
          }
        }
      };
      // Has rows but none contain "Estudiante"
      const spy = vi.spyOn(XLSX.utils, 'sheet_to_json').mockReturnValue([
        ['Invalido1', 'Invalido2', 'CIENCIAS'],
        ['', '', 'BIOLOGIA'],
        ['', '', 'P1'],
        [1, 'Alice', 4.5],
        [2, 'Bob', 3.5]
      ]);

      const report = validateWorkbook(mockWorkbook);
      expect(report.isValid).toBe(false);
      expect(report.issues[0]).toEqual(expect.objectContaining({
        code: 'MISSING_SCHEMA',
        severity: 'CRITICAL',
        sheet: '6A'
      }));
      spy.mockRestore();
    });

    it('validates sheet with proper ESTUDIANTE structure as valid', () => {
      const mockWorkbook: XLSX.WorkBook = {
        SheetNames: ['6A'],
        Sheets: {
          '6A': {
            '!ref': 'A1:C8'
          }
        }
      };
      const spy = vi.spyOn(XLSX.utils, 'sheet_to_json').mockReturnValue(
        buildValidSheetRows([
          [1, 'Alice', 4.5],
          [2, 'Bob', 3.5]
        ])
      );

      const report = validateWorkbook(mockWorkbook);
      expect(report.isValid).toBe(true);
      expect(report.totalSheetsProcessed).toBe(1);
      expect(report.issues).toHaveLength(0);
      spy.mockRestore();
    });

    it('identifies completely empty worksheets or sheets missing !ref (SUGGESTION EMPTY_SHEET)', () => {
      const mockWorkbook: XLSX.WorkBook = {
        SheetNames: ['6A'],
        Sheets: {
          '6A': {} // Missing !ref
        }
      };
      const report = validateWorkbook(mockWorkbook);
      expect(report.issues[0]).toEqual(expect.objectContaining({
        code: 'EMPTY_SHEET',
        severity: 'SUGGESTION',
        sheet: '6A',
        message: expect.stringContaining('vacía')
      }));
    });
  });
});
