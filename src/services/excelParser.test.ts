import { describe, it, expect, vi } from 'vitest';
import * as XLSX from 'xlsx';
import { parseHeaders, extractStudents, flattenRows, parseWorkbook, getColumnLetter, validateWorkbook } from './excelParser';
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

    it('handles out of range grades by converting to null', () => {
      const headers: HeaderComponent[] = [
        { index: 2, area: 'C1', asignatura: 'A1', componente: 'P1' }
      ];
      const dataRows = [[1, 'Pepe', 5.1]]; // Invalid grade

      const students = extractStudents(dataRows, headers, '10A');
      expect(students[0].areas['C1'].asignaturas['A1'].P1).toBeNull();
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

    it('dynamic DEF column detection: treats asignatura as Area DEF if NO dedicated DEF column is present', () => {
      const headers: HeaderComponent[] = [
        { index: 2, area: 'ETICA', asignatura: 'ETICA', componente: 'P1' }
      ];
      const dataRows = [
        [1, 'Juan Perez', 5.0]
      ];

      const students = extractStudents(dataRows, headers, '10A', '10A');
      expect(students.length).toBe(1);
      const juan = students[0];

      // Since there is no dedicated 'DEF' column under ETICA,
      // the ETICA column (where asignatura === area) must be treated as the Area's DEF:
      expect(juan.areas['ETICA'].asignaturas['ETICA']).toBeUndefined();
      expect(juan.areas['ETICA'].DEF.P1).toBe(5.0);
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
          return [
            ['No', 'Estudiante', 'CIENCIAS', undefined],
            ['', '', 'BIOLOGIA', 'DEF'],
            ['', '', 'P1', 'P1'],
            [1, 'Alice', 4.0, 4.0]
          ];
        }
        if (sheet === mockWorkbook.Sheets['6B']) {
          return [
            ['No', 'Estudiante', 'CIENCIAS', undefined],
            ['', '', 'BIOLOGIA', 'DEF'],
            ['', '', 'P1', 'P1'],
            [2, 'Bob', 3.0, 3.0]
          ];
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

    it('identifies sheet with less than 4 rows (CRITICAL MISSING_SCHEMA)', () => {
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
        sheet: '6A',
        message: expect.stringContaining('menos de 4 filas')
      }));
      spy.mockRestore();
    });

    it('identifies sheet missing mandatory headers ID/No and Name/Estudiante in rows 0-2 (CRITICAL MISSING_SCHEMA)', () => {
      const mockWorkbook: XLSX.WorkBook = {
        SheetNames: ['6A'],
        Sheets: {
          '6A': {
            '!ref': 'A1:C5'
          }
        }
      };
      // Columns 0 and 1 are invalid headers
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
        sheet: '6A',
        message: expect.stringContaining('ID')
      }));
      spy.mockRestore();
    });

    it('identifies student with blank name but row populated (WARNING MISSING_NAME)', () => {
      const mockWorkbook: XLSX.WorkBook = {
        SheetNames: ['6A'],
        Sheets: {
          '6A': {
            '!ref': 'A1:C5'
          }
        }
      };
      const spy = vi.spyOn(XLSX.utils, 'sheet_to_json').mockReturnValue([
        ['No', 'Estudiante', 'CIENCIAS'],
        ['', '', 'BIOLOGIA'],
        ['', '', 'P1'],
        [1, '', 4.5], // Name is blank, but row has ID 1 and grade 4.5
        [2, 'Bob', 3.5]
      ]);

      const report = validateWorkbook(mockWorkbook);
      expect(report.issues).toContainEqual(expect.objectContaining({
        code: 'MISSING_NAME',
        severity: 'WARNING',
        sheet: '6A',
        row: 4,
        col: 'B',
        message: expect.stringContaining('nombre en blanco')
      }));
      spy.mockRestore();
    });

    it('identifies empty grade cells in period columns (WARNING EMPTY_GRADE)', () => {
      const mockWorkbook: XLSX.WorkBook = {
        SheetNames: ['6A'],
        Sheets: {
          '6A': {
            '!ref': 'A1:C5'
          }
        }
      };
      const spy = vi.spyOn(XLSX.utils, 'sheet_to_json').mockReturnValue([
        ['No', 'Estudiante', 'CIENCIAS'],
        ['', '', 'BIOLOGIA'],
        ['', '', 'P1'],
        [1, 'Alice', null], // empty grade
        [2, 'Bob', 3.5]
      ]);

      const report = validateWorkbook(mockWorkbook);
      expect(report.issues).toContainEqual(expect.objectContaining({
        code: 'EMPTY_GRADE',
        severity: 'WARNING',
        sheet: '6A',
        row: 4,
        col: 'C',
        message: expect.stringContaining('Calificación vacía')
      }));
      spy.mockRestore();
    });

    it('identifies grade out of range or non-numeric (WARNING INVALID_GRADE)', () => {
      const mockWorkbook: XLSX.WorkBook = {
        SheetNames: ['6A'],
        Sheets: {
          '6A': {
            '!ref': 'A1:C6'
          }
        }
      };
      const spy = vi.spyOn(XLSX.utils, 'sheet_to_json').mockReturnValue([
        ['No', 'Estudiante', 'CIENCIAS'],
        ['', '', 'BIOLOGIA'],
        ['', '', 'P1'],
        [1, 'Alice', 5.5], // too high
        [2, 'Bob', -0.1], // too low
        [3, 'Charlie', 'abc'] // non-numeric
      ]);

      const report = validateWorkbook(mockWorkbook);
      expect(report.issues).toContainEqual(expect.objectContaining({
        code: 'INVALID_GRADE',
        severity: 'WARNING',
        sheet: '6A',
        row: 4,
        col: 'C',
        message: expect.stringContaining('fuera de rango')
      }));
      expect(report.issues).toContainEqual(expect.objectContaining({
        code: 'INVALID_GRADE',
        severity: 'WARNING',
        sheet: '6A',
        row: 5,
        col: 'C',
        message: expect.stringContaining('fuera de rango')
      }));
      expect(report.issues).toContainEqual(expect.objectContaining({
        code: 'INVALID_GRADE',
        severity: 'WARNING',
        sheet: '6A',
        row: 6,
        col: 'C',
        message: expect.stringContaining('no es un número')
      }));
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

    it('returns isValid: true and empty issues for a perfectly valid workbook', () => {
      const mockWorkbook: XLSX.WorkBook = {
        SheetNames: ['6A'],
        Sheets: {
          '6A': {
            '!ref': 'A1:C5'
          }
        }
      };
      const spy = vi.spyOn(XLSX.utils, 'sheet_to_json').mockReturnValue([
        ['No', 'Estudiante', 'CIENCIAS'],
        ['', '', 'BIOLOGIA'],
        ['', '', 'P1'],
        [1, 'Alice', 4.5],
        [2, 'Bob', 3.5]
      ]);

      const report = validateWorkbook(mockWorkbook);
      expect(report.isValid).toBe(true);
      expect(report.totalSheetsProcessed).toBe(1);
      expect(report.issues).toHaveLength(0);
      spy.mockRestore();
    });
  });
});
