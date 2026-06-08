import { describe, it, expect } from 'vitest';
import { generateExecutiveReport } from './executiveAnalytics';
import type { Estudiante } from '../domain/types';

describe('Executive Analytics Engine', () => {
  const createMockStudent = (
    id: string,
    name: string,
    grupo: string,
    areasData: { [key: string]: { promedio: number } }
  ): Estudiante => {
    const areas: Record<string, any> = {};
    Object.entries(areasData).forEach(([areaName, data]) => {
      areas[areaName] = {
        asignaturas: {},
        DEF: { P1: data.promedio, P2: null, P3: null },
        areaStats: {
          promedioActual: data.promedio,
          p4Min: 0,
          estado: { text: data.promedio >= 3.0 ? 'Ganado' : 'Perdido', color: 'gray' }
        }
      };
    });

    return {
      id,
      name,
      CURSO: grupo,
      grupo,
      areas
    } as unknown as Estudiante;
  };

  const mockStudents: Estudiante[] = [
    createMockStudent('1', 'A', '10A', {
      'Matemáticas': { promedio: 3.5 },
      'Ciencias': { promedio: 4.5 }
    }),
    createMockStudent('2', 'B', '10A', {
      'Matemáticas': { promedio: 2.5 }, // Fails Math
      'Ciencias': { promedio: 3.1 }
    }),
    createMockStudent('3', 'C', '10B', {
      'Matemáticas': { promedio: 4.0 },
      'Física': { promedio: 5.0 }
    }),
    createMockStudent('4', 'D', '10B', {
      'Matemáticas': { promedio: 2.0 }, // Fails Math
      'Física': { promedio: 2.0 }       // Fails Physics
    })
  ];

  it('calculates global KPIs and global status distribution correctly', () => {
    const report = generateExecutiveReport(mockStudents);

    expect(report.totalStudents).toBe(4);
    
    // Global Average: (4.0 + 2.8 + 4.5 + 2.0) / 4 = 13.3 / 4 = 3.325 -> 3.33
    expect(report.globalAverage).toBeCloseTo(3.33);

    // Global Pass Rate: 2 / 4 = 50%
    expect(report.globalPassRate).toBe(50);
    
    // Students at risk (En riesgo + Recuperable): 2
    expect(report.totalAtRisk).toBe(2);

    expect(report.globalStatusDistribution).toEqual({
      ganado: 2,
      recuperable: 0,
      enRiesgo: 2
    });
  });

  it('identifies top 5 students globally', () => {
    const report = generateExecutiveReport(mockStudents);
    expect(report.topStudents).toHaveLength(4); // We only mocked 4
    expect(report.topStudents[0].name).toBe('C'); // 4.5 average
    expect(report.topStudents[1].name).toBe('A'); // 3.5 average
  });

  it('groups metrics by course correctly', () => {
    const report = generateExecutiveReport(mockStudents);
    
    expect(report.groups).toHaveLength(2); // 10A and 10B

    const group10A = report.groups.find(g => g.groupName === '10A')!;
    expect(group10A.totalStudents).toBe(2);
    // (4.0 + 2.8) / 2 = 3.4
    expect(group10A.average).toBeCloseTo(3.4);
    // 1 pass, 1 fail
    expect(group10A.passRate).toBe(50);
    expect(group10A.atRiskCount).toBe(1);

    const group10B = report.groups.find(g => g.groupName === '10B')!;
    expect(group10B.totalStudents).toBe(2);
    // (4.5 + 2.0) / 2 = 3.25
    expect(group10B.average).toBeCloseTo(3.25);
    expect(group10B.passRate).toBe(50);
    expect(group10B.atRiskCount).toBe(1);
  });

  it('calculates critical areas across all groups', () => {
    const report = generateExecutiveReport(mockStudents);

    // Failures:
    // A: Math(3.5 - pass)
    // B: Math(2.5 - fail)
    // C: Math(4.0 - pass)
    // D: Math(2.0 - fail), Physics(2.0 - fail)
    
    // Total Math fails = 2
    // Total Physics fails = 1
    // Total Ciencias fails = 0
    expect(report.criticalAreas).toHaveLength(2); // Only failed areas are reported
    
    const mathFail = report.criticalAreas.find(a => a.areaName === 'Matemáticas')!;
    expect(mathFail.failureCount).toBe(2);

    const physicsFail = report.criticalAreas.find(a => a.areaName === 'Física')!;
    expect(physicsFail.failureCount).toBe(1);

    // Check sorting (descending by failures)
    expect(report.criticalAreas[0].areaName).toBe('Matemáticas');
  });

  it('handles empty student list', () => {
    const report = generateExecutiveReport([]);
    expect(report.totalStudents).toBe(0);
    expect(report.globalAverage).toBe(0);
    expect(report.globalPassRate).toBe(0);
    expect(report.totalAtRisk).toBe(0);
    expect(report.globalStatusDistribution).toEqual({ ganado: 0, recuperable: 0, enRiesgo: 0 });
    expect(report.groups).toEqual([]);
    expect(report.criticalAreas).toEqual([]);
    expect(report.topStudents).toEqual([]);
  });
});
