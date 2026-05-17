import { describe, it, expect } from 'vitest';
import { parseHeaders, extractStudents, flattenRows } from './excelParser';
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
  });

  describe('flattenRows', () => {
    it('flattens nested entities into RowArea and RowAsignatura arrays', () => {
      const students: Estudiante[] = [
        {
          id: '1',
          name: 'JUAN',
          CURSO: '10A',
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
});
