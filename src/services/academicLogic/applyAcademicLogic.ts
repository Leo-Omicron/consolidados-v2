import type { Estudiante, PeriodConfig, SubjectWeightConfig, PeriodoNotas } from '../../domain/types';
import { 
  createAreaRowId, 
  createLegacyAreaRowId, 
  createLegacySubjectRowId, 
  createSubjectRowId 
} from '../rowIdentity';
import { getEvaluatedPeriods } from './gradeExtraction';
import { 
  calcularAcumuladoBase, 
  calcularMinimoRequerido, 
  calcularPromedioActual, 
  determinarEstado 
} from './periodCalculations';
import { 
  calculateWeightedAreaPeriodGrade, 
  createUniformSubjectWeights 
} from './weightInference';

export function applyAcademicLogic(
  students: Estudiante[],
  config: PeriodConfig,
  subjectWeights: SubjectWeightConfig = {},
  activeSimulations: Record<string, Partial<PeriodoNotas>> = {}
): void {
  const evaluated = getEvaluatedPeriods(students);
  const getOverrides = (rowId: string, legacyRowId: string): Partial<PeriodoNotas> | undefined =>
    activeSimulations[rowId] ?? activeSimulations[legacyRowId];

  students.forEach(student => {
    Object.entries(student.areas).forEach(([areaName, area]) => {
      // Calculate each asignatura
      Object.entries(area.asignaturas).forEach(([asigName, asig]) => {
        const asigRowId = createSubjectRowId(student.id, areaName, asigName);
        const legacyAsigRowId = createLegacySubjectRowId(student.id, areaName, asigName);
        const overrides = getOverrides(asigRowId, legacyAsigRowId);
        if (overrides) {
          (Object.keys(overrides) as Array<keyof PeriodoNotas>).forEach((period) => {
            const val = overrides[period];
            if (val !== undefined) {
              if (period === 'P4') {
                asig.P4 = val;
              } else {
                asig[period] = val;
              }
            }
          });
        }

        asig.A = calcularAcumuladoBase(asig, config, evaluated);
        asig.promedioActual = calcularPromedioActual(asig, config, evaluated);
        asig.p4Min = calcularMinimoRequerido(asig, config, evaluated);
        asig.estado = determinarEstado(asig, config, evaluated);
      });

      // Dynamically calculate Area DEF if weights are provided (or fallback to uniform weights if there are multiple subjects)
      const groupWeights = (subjectWeights as unknown as Record<string, Record<string, Record<string, number>>>)[student.grupo] || {};
      let weights = groupWeights[areaName] || (subjectWeights as unknown as Record<string, Record<string, number>>)[areaName];
      
      if (Object.keys(area.asignaturas).length > 0) {
        if (!weights || Object.keys(weights).length === 0) {
          weights = createUniformSubjectWeights(Object.keys(area.asignaturas));
        }

        (['P1', 'P2', 'P3', 'P4'] as const).forEach(period => {
          area.DEF[period] = calculateWeightedAreaPeriodGrade(area, period, evaluated, weights);
        });
      }

      // Apply direct area simulations overrides to area.DEF before calculating areaStats
      const areaRowId = createAreaRowId(student.id, areaName);
      const legacyAreaRowId = createLegacyAreaRowId(student.id, areaName);
      const areaOverrides = getOverrides(areaRowId, legacyAreaRowId);
      if (areaOverrides) {
        (Object.keys(areaOverrides) as Array<keyof PeriodoNotas>).forEach((period) => {
          const val = areaOverrides[period];
          if (val !== undefined) {
            if (period === 'P4') {
              area.DEF.P4 = val;
            } else {
              area.DEF[period] = val;
            }
          }
        });
      }

      // If the area has no subjects, the UI renders a fallback subject row for the area.
      // We apply its overrides directly to area.DEF.
      if (Object.keys(area.asignaturas).length === 0) {
        const fallbackSubjectRowId = createSubjectRowId(student.id, areaName, areaName);
        const legacyFallbackSubjectRowId = createLegacySubjectRowId(student.id, areaName, areaName);
        const fallbackOverrides = getOverrides(fallbackSubjectRowId, legacyFallbackSubjectRowId);
        if (fallbackOverrides) {
          (Object.keys(fallbackOverrides) as Array<keyof PeriodoNotas>).forEach((period) => {
            const val = fallbackOverrides[period];
            if (val !== undefined) {
              if (period === 'P4') {
                area.DEF.P4 = val;
              } else {
                area.DEF[period] = val;
              }
            }
          });
        }
      }

      // Calculate area stats based on area DEF
      area.DEF.A = calcularAcumuladoBase(area.DEF, config, evaluated);
      area.areaStats = {
        promedioActual: calcularPromedioActual(area.DEF, config, evaluated),
        p4Min: calcularMinimoRequerido(area.DEF, config, evaluated),
        estado: determinarEstado(area.DEF, config, evaluated),
      };
    });
  });
}
