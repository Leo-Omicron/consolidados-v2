import { describe, it, expect } from 'vitest';
import { determinePromotionDecision } from './statusHelpers';
import type { Estudiante } from '../../domain/types';

describe('statusHelpers - determinePromotionDecision', () => {
  it('returns Aprobado when student has 0 failed areas', () => {
    const est: Partial<Estudiante> = {
      areas: {
        'Matemáticas': { areaStats: { promedioActual: 3.5, p4Min: 0, estado: { text: 'Ganado', color: 'green' } }, asignaturas: {}, DEF: { P1: null, P2: null, P3: null } },
      }
    };
    expect(determinePromotionDecision(est as Estudiante)).toBe('Aprobado');
  });

  it('returns Compromisos when student has 1 or 2 failed areas but average is passing', () => {
    const est: Partial<Estudiante> = {
      areas: {
        'Matemáticas': { areaStats: { promedioActual: 2.0, p4Min: 4.5, estado: { text: 'Recuperable', color: 'blue' } }, asignaturas: {}, DEF: { P1: null, P2: null, P3: null } },
        'Lenguaje': { areaStats: { promedioActual: 5.0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } }, asignaturas: {}, DEF: { P1: null, P2: null, P3: null } },
      }
    };
    expect(determinePromotionDecision(est as Estudiante)).toBe('Compromisos');
  });

  it('returns Reprobado when student has 3 or more failed areas', () => {
    const est: Partial<Estudiante> = {
      areas: {
        'Mat': { areaStats: { promedioActual: 2.0, p4Min: 4.5, estado: { text: 'En riesgo', color: 'red' } }, asignaturas: {}, DEF: { P1: null, P2: null, P3: null } },
        'Fis': { areaStats: { promedioActual: 2.0, p4Min: 4.5, estado: { text: 'En riesgo', color: 'red' } }, asignaturas: {}, DEF: { P1: null, P2: null, P3: null } },
        'Qui': { areaStats: { promedioActual: 2.0, p4Min: 4.5, estado: { text: 'En riesgo', color: 'red' } }, asignaturas: {}, DEF: { P1: null, P2: null, P3: null } },
      }
    };
    expect(determinePromotionDecision(est as Estudiante)).toBe('Reprobado');
  });
});
