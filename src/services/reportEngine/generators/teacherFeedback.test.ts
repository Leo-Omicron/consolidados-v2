import { describe, it, expect } from 'vitest';
import { generateTeacherFeedbackReportForGroup } from './teacherFeedback';
import { baseConfig, getStudent } from '../test-fixtures';

describe('teacherFeedback', () => {
  describe('generateTeacherFeedbackReportForGroup', () => {
    it('handles empty group', () => {
      expect(generateTeacherFeedbackReportForGroup([], '10A', baseConfig)).toEqual([]);
    });

    it('generates detailed feedback including rescue routes', () => {
      const students = [
        getStudent('1', '10A', {
          MATH: {
            areaStats: { promedioActual: 2.0, p4Min: 4.5, estado: { text: 'En riesgo' } },
            asignaturas: { 'Alg': {}, 'Geom': {} }
          },
          SCI: {
            areaStats: { promedioActual: 4.5 }
          }
        }), // Compromisos (1 failed)
        getStudent('2', '10A', {}, { 'DEF': 4.6 }) // Excelente
      ];
      const reports = generateTeacherFeedbackReportForGroup(students, '10A', baseConfig);
      expect(reports).toHaveLength(2);
      
      const s1 = reports.find(r => r.studentId === '1');
      expect(s1?.weaknessesDetail[0].rescueRoute).toHaveLength(2); // Alg, Geom
      expect(s1?.overallStatus).toBe('Compromisos');
      expect(s1?.adviceText).toContain('pendientes');
      
      const s2 = reports.find(r => r.studentId === '2');
      expect(s2?.adviceText).toContain('Continúa con ese gran nivel');
    });

    it('advice text conditions', () => {
      const students = [
        getStudent('1', '10A', {}, { 'DEF': 4.1 }),
        getStudent('2', '10A', {}, { 'DEF': 3.5 }), // Aprobado
        getStudent('3', '10A', {
           A: { areaStats: { promedioActual: 2.0, estado: { text: 'Perdido', color: 'red' } } },
           B: { areaStats: { promedioActual: 2.0, estado: { text: 'Perdido', color: 'red' } } },
           C: { areaStats: { promedioActual: 2.0, estado: { text: 'Perdido', color: 'red' } } }
        }, { 'DEF': 2.0 }), // Reprobado
        getStudent('4', '10A', {
          A: { areaStats: { promedioActual: 2.0, p4Min: 6.0, estado: { text: 'Perdido', color: 'red' } } } // impossible
        }, { 'DEF': 3.0 }), // Compromisos, but impossible area
        getStudent('5', '10A', {
          B: {} // missing areaStats
        }),
        getStudent('6', '10A', {
          C: { areaStats: { promedioActual: 3.5, p4Min: 3.0, estado: { text: 'Ganado', color: 'green' } } } // between 3.0 and 4.0
        }, null, { 'DEF': 2 }) // with official ranking
      ];
      const reports = generateTeacherFeedbackReportForGroup(students, '10A', baseConfig);
      expect(reports.find(r => r.studentId === '1')?.adviceText).toContain('Excelente rendimiento');
      expect(reports.find(r => r.studentId === '2')?.adviceText).toContain('Buen desempeño general');
      expect(reports.find(r => r.studentId === '3')?.adviceText).toContain('situación académica es crítica');
      expect(reports.find(r => r.studentId === '4')?.weaknessesDetail[0].isImpossible).toBe(true);
      expect(reports.find(r => r.studentId === '5')?.strengths).toEqual([]);
      expect(reports.find(r => r.studentId === '6')?.puestoGrupo).toBe(2);
    });
  });
});
